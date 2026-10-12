import "dotenv/config";
import path from "path";
import { DataSource } from "typeorm";
import { Client } from "@elastic/elasticsearch";

import { config } from "./app.config";

export const getDatabaseConfig = () => {
  const isProduction = config.NODE_ENV === "production";
  const databaseUrl = config.DATABASE_URL;

  return new DataSource({
    type: "postgres",
    url: databaseUrl,
    entities: [path.join(__dirname, "../database/entities/*{.ts,.js}")],
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
  node: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200",
});


export const AppDataSource = getDatabaseConfig();
