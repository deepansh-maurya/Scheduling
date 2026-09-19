import { IncomingMessage } from "node:http";
import { redisClient } from "../../../core/config/redis.config";
import { wsLiveMeet } from "../../../core/config/socket.config";
import { deepgramConnection } from "./deepgram.provider";
import { User } from "../../../core/database/entities/user.entity";
import { RawData, WebSocket } from "ws";
import { createEmbeddingsAndSave } from "../meeting.service";

wsLiveMeet.on(
  "connection",
  async (ws: WebSocket, _: IncomingMessage, user: User, meetingId: string) => {
    try {
      const dgConnection = await deepgramConnection();

      dgConnection.on("open", () => {
        console.log("dg connected");
      });

      dgConnection.on("message", async (data: any) => {
        if (data.type === "Results" && data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];
          console.log(alternative);
          const transcript = alternative.transcript;
          const channel = data.channel_index?.[0];
          const start = alternative?.words?.[0]?.start;
          const end = alternative?.words?.[alternative?.words?.length - 1]?.end;

          console.log({
            start,
            end,
            transcript,
            channel
          });

          if (transcript && data.is_final) {
            const key = `transcript:${user.id}:${meetingId}`;

            await redisClient.rPush(
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

            const length = await redisClient.lLen(key);

            if (length >= 60) {
              createEmbeddingsAndSave(meetingId, user.id);
            }
          }
        }
      });

      ws.on("message", (raw: RawData, isBinary: boolean) => {
        if (isBinary) dgConnection.sendMedia(raw);
      });

      ws.on("close", () => {
        dgConnection.close();
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
