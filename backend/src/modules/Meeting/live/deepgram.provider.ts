import { DeepgramClient } from "@deepgram/sdk";

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

  socket.on("error", (err: any) => {
    console.error("Deepgram error:", err);
  });

  socket.connect();

  await socket.waitForOpen();

  return socket;
};
