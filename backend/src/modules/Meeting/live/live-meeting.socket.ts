import { IncomingMessage } from "node:http";
import { redisClient } from "../../../config/redis.config";
import { wsLiveMeet } from "../../../config/socket.config";
import { deepgramConnection } from "./deepgram.provider";
import { User } from "../../../database/entities/user.entity";
import { createEmbeddingsAndSave } from "../../../services/meeting.service";

wsLiveMeet.on(
  "connection",
  async (ws: any, _: IncomingMessage, user: User, meetingId: string) => {
    try {
      const dgConnection = await deepgramConnection();

      dgConnection.on("open", () => {
        console.log("dg connected");
      });

      dgConnection.on("message", async (data: any) => {
        if (data.type === "Results" && data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];
          const transcript = alternative.transcript;
          const channel = data.channel_index?.[0];
          const start = alternative.start;
          const end = alternative.end;

          if (transcript && data.is_final) {
            const key = `transcript:${user.id}:${meetingId}`;

            await redisClient.append(
              key,
              JSON.stringify({
                channel,
                transcript,
                start,
                end
              })
            );

            ws.send(
              JSON.stringify({
                channel,
                transcript
              })
            );
          }
        }
      });

      ws.on("message", (raw: any, isBinary: boolean) => {
        if (isBinary) dgConnection.sendMedia(raw);
      });

      ws.on("close", () => {
        dgConnection.close();
        createEmbeddingsAndSave(meetingId, user.id);
      });

      dgConnection.on("error", (err: any) => {
        console.error("Deepgram error:", err);

        if (ws.readyState === ws.OPEN) {
          ws.close(1011, "Transcription service error");
        }
      });
    } catch (err: any) {
      console.error("Failed to initialize Deepgram:", err);

      if (ws.readyState === ws.OPEN) {
        ws.close(1011, "Failed to initialize transcription");
      }
    }
  }
);
