import { IncomingMessage } from "node:http";
import { redisClient } from "../../../config/redis.config";
import { wsLiveMeet } from "../../../config/socket.config";
import { deepgramConnection } from "./deepgram.provider";
import { User } from "../../../database/entities/user.entity";

wsLiveMeet.on(
  "connection",
  async (ws: any, _: IncomingMessage, user: User, meetingId: string) => {
    try {
      const dgConnection = await deepgramConnection();

      dgConnection.on("message", async (data) => {
        if (data.type === "Results" && data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;

          const channel = data.channel_index?.[0];

          if (transcript && data.is_final) {
            const key = `transcript:${user.id}:${meetingId}`;

            await redisClient.append(
              key,
              JSON.stringify({
                channel,
                transcript
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
      
      ws.on("message", (_: WebSocket, raw: any, isBinary: boolean) => {
        if (isBinary) dgConnection.sendMedia(raw);
      });

      ws.on("close", () => {
        dgConnection.close();
      });

      dgConnection.on("error", (err) => {
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
