import "dotenv/config";
import "./config/auth.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { config } from "./config/app.config";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { asyncHandler } from "./middlewares/asyncHandler.middeware";
import { initializeDatabase } from "./database/database";
import authRoutes from "./routes/auth.route";
import passport from "passport";
import eventRoutes from "./routes/event.route";
import availabilityRoutes from "./routes/availability.route";
import integrationRoutes from "./routes/integration.route";
import meetingRoutes from "./routes/meeting.route";
import { createServer } from "http";
import { wsLiveMeet } from "./config/socket.config";
import { authenticateWebSocket } from "./config/auth.config";
import { connectRedis } from "./config/redis.config";

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
    // throw new BadRequestException("throwing async error");
    res.status(HTTPSTATUS.OK).json({
      message: "i am healthy "
    });
  })
);

app.get(
  "/running",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // throw new BadRequestException("throwing async error");
    res.status(HTTPSTATUS.OK).json({
      message: "i am running "
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/event`, eventRoutes);
app.use(`${BASE_PATH}/availability`, availabilityRoutes);
app.use(`${BASE_PATH}/integration`, integrationRoutes);
app.use(`${BASE_PATH}/meeting`, meetingRoutes);

app.use(errorHandler);

const server = createServer(app);

server.on("upgrade", async (request, socket, head) => {
  const { pathname, searchParams } = new URL(
    request.url!,
    `http://${request.headers.host}`
  );

  if (pathname.startsWith("/ws/live-meeting")) {
    const user = await authenticateWebSocket(request);
    const meetingId = searchParams.get("meetingId");

    if (!user || !meetingId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wsLiveMeet.handleUpgrade(request, socket, head, (ws) => {
      wsLiveMeet.emit("connection", ws, request, user, meetingId);
    });
  }
});

server.listen(config.PORT, async () => {
  await initializeDatabase();
  await connectRedis();
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
});
