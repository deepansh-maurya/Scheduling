import "dotenv/config";
import path from "path";
import { DataSource } from "typeorm";
import { Client } from "@elastic/elasticsearch";

import { config } from "./app.config";
import { TranscriptChunk } from "../database/entities/transcript-chunk.entity";
import { Availability } from "../database/entities/availability.entity";
import { Conversation } from "../database/entities/conversations.entity";
import { DayAvailability } from "../database/entities/day-availability";
import { Event } from "../database/entities/event.entity";
import { Integration } from "../database/entities/integration.entity";
import { MeetingFrame } from "../database/entities/meeting-frames.entity";
import { MeetingParticipant } from "../database/entities/meeting-participants.entity";
import { Meeting } from "../database/entities/meeting.entity";
import { ResourceChunk } from "../database/entities/resource-chunks.entity";
import { ResourceProcessingJob } from "../database/entities/resource-processing-jobs.entity";
import { Resource } from "../database/entities/resources.entity";
import { User } from "../database/entities/user.entity";

export const getDatabaseConfig = () => {
  const isProduction = config.NODE_ENV === "production";
  const databaseUrl = config.DATABASE_URL;

  return new DataSource({
    type: "postgres",
    url: databaseUrl,
    entities: [
      TranscriptChunk,
      Availability,
      Conversation,
      DayAvailability,
      Event,
      Integration,
      MeetingFrame,
      MeetingParticipant,
      Meeting,
      ResourceChunk,
      ResourceProcessingJob,
      Resource,
      User
    ],
    migrations: [path.join(__dirname, "../database/migrations/*{.ts,.js}")],
    synchronize: !isProduction,
    logging: isProduction ? false : ["error"]
    // ssl: isProduction
    //   ? {
    //       rejectUnauthorized: true,
    //     }
    //   : {
    //       rejectUnauthorized: false,
    //     },
  });
};

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200"
});

export const AppDataSource = getDatabaseConfig();
