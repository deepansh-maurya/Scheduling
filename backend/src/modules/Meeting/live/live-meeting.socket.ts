import { IncomingMessage } from "node:http";
import { redisClient, redisPubSub } from "../../../core/config/redis.config";
import { wsLiveMeet } from "../../../core/config/socket.config";
import { deepgramConnection, dEvents } from "./deepgram.provider";
import { User } from "../../../core/database/entities/user.entity";
import { RawData, WebSocket } from "ws";
import { PubSubEnum } from "../../../core/enums/live-meet-con.enum";

// Window-Based Semantic Boundary Detection chunkiing strategy for running transcript

wsLiveMeet.on(
  "connection",
  async (ws: WebSocket, _: IncomingMessage, user: User, meetingId: string) => {
    try {
      dEvents.on("open", async () => {
        console.log("dg connected");
        console.log("event published live meet");
        const subscribers = await redisPubSub.publish(
          PubSubEnum.START,
          JSON.stringify({
            type: "START",
            meetingId,
            userId: user.id
          })
        );

        console.log("START published; subscribers:", subscribers);
      });

      dEvents.on("message", async (data: any) => {
        if (data.type === "Results" && data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];
          const transcript = alternative.transcript;
          const channel = data.channel_index?.[0];
          const start = alternative?.words?.[0]?.start;
          const end = alternative?.words?.[alternative?.words?.length - 1]?.end;

          if (transcript && data.is_final) {
            const key = `transcript:${user.id}:${meetingId}`;

            await redisClient.xAdd(key, "*", {
              channel: String(channel),
              transcript,
              start: String(start),
              end: String(end)
            });
            console.log("event sent");
            ws.send(
              JSON.stringify({
                channel,
                transcript
              })
            );
          }
        }
      });

      const deepgramClient = await deepgramConnection();

      ws.on("message", (raw: RawData, isBinary: boolean) => {
        if (isBinary) deepgramClient?.sendMedia(raw);
      });

      ws.on("close", () => {
        redisPubSub.publish(
          PubSubEnum.STOP,
          JSON.stringify({
            type: "START",
            meetingId,
            userId: user.id
          })
        );
        deepgramClient.close();
      });

      dEvents.on("error", (err: any) => {
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
