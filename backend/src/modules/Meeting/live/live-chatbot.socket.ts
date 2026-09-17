import { IncomingMessage } from "node:http";
import { wsChatbot } from "../../../config/socket.config";
import { User } from "../../../database/entities/user.entity";
import { RawData, WebSocket } from "ws";
import { AppDataSource } from "../../../config/database.config";
import { TranscriptChunk } from "../../../database/entities/transcript-chunk.entity";
import ollama from "ollama";
import { Meeting } from "../../../database/entities/meeting.entity";
import { Llm, LlmMessage } from "../../../config/nvidia.config";
import { meetingPrompt } from "../../../Prompts/meeting.prompt";
import { redisClient } from "../../../config/redis.config";

interface Message {
  question: string;
  files: string[];
}

wsChatbot.on(
  "connection",
  async (ws: WebSocket, _: IncomingMessage, user: User, meetingId: string) => {
    try {
      const meetingRepo = AppDataSource.getRepository(Meeting);
      const meeting = await meetingRepo.findOne({ where: { id: meetingId } });

      ws.on("message", async (raw: RawData) => {
        const data: Message = JSON.parse(raw.toString());
        const chunkRepo = AppDataSource.getRepository(TranscriptChunk);

        const response = await ollama.embed({
          model: "nomic-embed-text",
          input: data.question
        });

        const embedding = response.embeddings[0];

        const results = await chunkRepo
          .createQueryBuilder("chunk")
          .addSelect("chunk.embedding <=> :embedding", "distance")
          .where("chunk.meetingId = :meetingId", {
            meetingId
          })
          .orderBy("distance", "ASC")
          .limit(5)
          .setParameter("embedding", JSON.stringify(embedding))
          .getRawMany();

        const transcript = results?.map((r) => r).join("\n");

        const segments = await redisClient.lRange(
          `transcript:${user.id}:${meetingId}`,
          0,
          59
        );

        const message: LlmMessage[] = [
          {
            role: "system",
            content: meetingPrompt({
              MEETING_CONTEXT: JSON.stringify(meeting),
              USER_QUESTION: data.question,
              FILES_CONTEXT: data.files,
              RETRIEVED_TRANSCRIPT: transcript,
              RECENT_TRANSCRIPT: segments
                ?.map(
                  (c: any) =>
                    `${c.timstamp} [${c.channelString}] ${c.transcript}`
                )
                .join("\n")
            })
          }
        ];

        const llmResponse = await Llm.call(message);
        console.log(llmResponse);
      });
    } catch (err: any) {
      if (ws.readyState === ws.OPEN) {
        ws.close(1011, "Failed to initialize chabot");
      }
    }
  }
);
