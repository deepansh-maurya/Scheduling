import { DeepgramClient } from "@deepgram/sdk";
import { EventEmitter } from "node:events";

export const dEvents = new EventEmitter();

export const deepgramConnection = async (): Promise<any> => {
  const deepgram = new DeepgramClient({
    apiKey: process.env.DEEPGRAM_API_KEY
  });

  const socket = await deepgram.listen.v1.createConnection({
    model: "nova-3",
    language: "en",
    interim_results: "true",
    channels: 2,
    multichannel: "true"
  });

  socket.on("open", () => {
    dEvents.emit("open", "");
  });
  socket.on("message", (data) => {
    dEvents.emit("message", data);
  });
  socket.on("error", (error) => {
    dEvents.emit("error", error);
  });
  socket.on("close", () => {
    dEvents.emit("close", "");  
  });

  socket.connect();

  await socket.waitForOpen();

  return socket;
};
