import "dotenv/config";
import "./config/auth.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { config } from "./config/app.config";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { asyncHandler } from "./middlewares/asyncHandler.middeware";
import { initializeDatabase } from "./database/database";
import authRoutes from "./modules/Auth/auth.route";
import passport from "passport";
import eventRoutes from "./modules/Event/event.route";
import availabilityRoutes from "./modules/Event/availability.route";
import meetingRoutes from "./modules/Meeting/meeting.route";
import { createServer } from "http";
import { wsLiveMeet } from "./config/socket.config";
import { authenticateWebSocket } from "./config/auth.config";
import { connectRedis } from "./config/redis.config";
import { AppDataSource } from "./config/database.config";
import { Meeting, MeetingStatus } from "./database/entities/meeting.entity";
import "./modules/Meeting/live/live-meeting.socket";
import integrationRoutes from "./modules/Integration/integration.route";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true
  })
);

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
      message: "i am healthy "
    });
  })
);

app.get(
  "/running",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
      message: "i am running "
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/event`, eventRoutes);
app.use(`${BASE_PATH}/availability`, availabilityRoutes);
app.use(`${BASE_PATH}/integration`, integrationRoutes );
app.use(`${BASE_PATH}/meeting`, meetingRoutes);

app.use(errorHandler);

const server = createServer(app);

server.on("upgrade", async (request, socket, head) => {
  try {
    const { pathname, searchParams } = new URL(
      request.url!,
      `http://${request.headers.host}`
    );

    const token = searchParams.get("token");

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const user = await authenticateWebSocket(token);
    const meetingId = searchParams.get("meetingId");

    console.log("reached");

    if (!user || !meetingId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    console.log("verified");

    const meetingRepo = AppDataSource.getRepository(Meeting);
    const isMeetingAvail = await meetingRepo.findOne({
      where: { id: meetingId }
    });

    if (isMeetingAvail?.status != "SCHEDULED") {
      socket.write(
        "HTTP/1.1 403 Forbidden\r\n" +
          "Content-Type: application/json\r\n" +
          "\r\n" +
          JSON.stringify({
            message: "Meeting is not available for live transcription"
          })
      );

      socket.destroy();
      return;
    }

    if (pathname.startsWith("/ws/live-meeting")) {
      await meetingRepo.update(
        { id: meetingId },
        { status: MeetingStatus.IN_PROGRESS }
      );

      wsLiveMeet.handleUpgrade(request, socket, head, (ws) => {
        wsLiveMeet.emit("connection", ws, request, user, meetingId);
      });
    }

    if (pathname.startsWith("/ws/live-chatbot")) {
      wsLiveMeet.handleUpgrade(request, socket, head, (ws) => {
        wsLiveMeet.emit("connection", ws, request, user, meetingId);
      });
    }
  } catch (error) {
    socket.write("HTTP/1.1 500 something_went_wrong\r\n\r\n");
    socket.destroy();
  }
});

server.listen(config.PORT, async () => {
  await initializeDatabase();
  await connectRedis();
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
});
