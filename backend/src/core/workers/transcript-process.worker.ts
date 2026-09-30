import ollama from "ollama";
import { redisClient, redisPubSub } from "../config/redis.config";
import { PubSubEnum } from "../enums/live-meet-con.enum";
import { DeepPartial, Repository } from "typeorm";
import { AppDataSource, elasticsearch } from "../config/database.config";
import { TranscriptChunk } from "../database/entities/transcript-chunk.entity";

interface Message { 
  type: "START" | "STOP";
  meetingId: string;
  userId: string;
}

class SubscribeMeetStart {
  connections: Map<string, TranscriptProcessWorker>;

  constructor() {
    redisPubSub.subscribe(PubSubEnum.START, async (message) => {
      const { meetingId, userId } = JSON.parse(message) as Message;
      const connection = new TranscriptProcessWorker(meetingId, userId);
      this.connections.set(`${userId}:${meetingId}`, connection);
    });

    redisPubSub.subscribe(PubSubEnum.STOP, async (message) => {
      const { meetingId, userId } = JSON.parse(message) as Message;
      const connection = this.connections.get(`${userId}:${meetingId}`);
      connection?.stop();
      this.connections.delete(`${userId}:${meetingId}`);
    });
  }
}

class TranscriptProcessWorker {
  constructor(
    public meetingId: string,
    public userId: string,
    public shouldStop?: boolean
  ) {
    this.meetingId = meetingId;
    this.userId = userId;
    this.streamAndProcess();
  }

  async streamAndProcess() {
    try {
      const key = `transcript:${this.userId}:${this.meetingId}`;

      while (!this.shouldStop) {
        let lastId = "0-0";

        let windowGroup: {
          chat: string;
          embedding: number[] | null;
          start: string;
          end: string;
          channel: string[];
        }[] = [];

        let currentWindow: {
          start: string;
          end: string;
          channel: string;
          chat: string;
        }[] = [];

        try {
          const result = await redisClient.xRead(
            {
              key,
              id: lastId
            },
            {
              BLOCK: 0,
              COUNT: 1
            }
          );

          if (!result || !Array.isArray(result)) continue;

          const streams = result as {
            name: string;
            messages: {
              id: string;
              message: Record<string, string>;
            }[];
          }[];

          for (const stream of streams) {
            for (const data of stream.messages) {
              const { id, message } = data;
              const { channel, transcript, start, end } = message;

              console.log(channel);
              console.log(transcript);
              console.log(start);

              currentWindow.push({ channel, start, end, chat: transcript });

              lastId = id;
              await redisClient.xDel(key, message.id);
            }
          }

          if (currentWindow.length > 1) {
            if (windowGroup.length == 0) {
              windowGroup.push({
                chat: currentWindow?.[0].chat + currentWindow?.[1].chat,
                embedding: null,
                channel: [
                  ...new Set([
                    currentWindow[0].channel,
                    currentWindow[1].channel
                  ])
                ],
                end: currentWindow[1].end,
                start: currentWindow[0].start
              });

              currentWindow = [];
              continue;
            }

            const lastWindow = windowGroup.pop()!;
            const latestWindow = {
              chat: currentWindow?.[0].chat + currentWindow?.[1].chat,
              embedding: null,
              channel: [
                ...new Set([currentWindow[0].channel, currentWindow[1].channel])
              ],
              end: currentWindow[1].end,
              start: currentWindow[0].start
            };

            currentWindow = [];

            const response = await ollama.embed({
              model: "nomic-embed-text",
              input: `${latestWindow.start}:${JSON.stringify(latestWindow.channel)}:${latestWindow.chat}`
            });

            const latestWindowembedding = response.embeddings[0];

            const lastWindowEmbedding = lastWindow.embedding
              ? lastWindow.embedding
              : (
                  await ollama.embed({
                    model: "nomic-embed-text",
                    input: `${lastWindow.start}:${JSON.stringify(lastWindow.channel)}:${lastWindow.chat}`
                  })
                ).embeddings[0];

            const similarity = this.cosineSimilarity(
              lastWindowEmbedding,
              latestWindowembedding
            );

            if (similarity > 0.8) {
              windowGroup.push({
                chat: lastWindow.chat,
                embedding: lastWindowEmbedding,
                channel: lastWindow.channel,
                start: lastWindow.start,
                end: lastWindow.end
              });
            } else {
              const rawTranscript = windowGroup
                .map((d) => `${d.start}:${JSON.stringify(d.channel)}:${d.chat}`)
                .join("\n");

              const response = await ollama.embed({
                model: "nomic-embed-text",
                input: rawTranscript
              });

              const embeddings = response.embeddings[0];

              const transcriptChunkRepo: Repository<TranscriptChunk> =
                AppDataSource.getRepository(TranscriptChunk);

              const channels = [
                ...new Set(windowGroup.flatMap((d) => d.channel))
              ];

              const chunk: DeepPartial<TranscriptChunk> =
                //! doubtable
                transcriptChunkRepo.create({
                  //@ts-ignore
                  embedding: embeddings,
                  endTime: windowGroup[windowGroup.length - 1].end,
                  meetingId: this.meetingId,
                  content: rawTranscript,
                  participants: channels as any,
                  startTime: windowGroup[0].start
                });

              await elasticsearch.index({
                index: "meetly_content",
                id: chunk.id,
                document: {
                  id: chunk.id,
                  type: "transcript_chunk",
                  userId: this.userId,
                  meetingId: chunk.meetingId,
                  content: chunk.content,
                  //! doubtable
                  speakerIds: JSON.stringify(channels),
                  startTime: chunk.startTime,
                  endTime: chunk.endTime,
                  createdAt: chunk.createdAt
                }
              });

              await transcriptChunkRepo.save(chunk);

              windowGroup = [];
            }
            windowGroup.push({
              chat: latestWindow.chat,
              embedding: latestWindowembedding,
              start: latestWindow.start,
              end: latestWindow.end,
              channel: latestWindow.channel
            });

            console.log(similarity);
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  cosineSimilarity(a: number[], b: number[]) {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  stop() {
    this.shouldStop = true;
  }
}

new SubscribeMeetStart();
