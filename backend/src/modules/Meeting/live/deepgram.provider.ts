import { DeepgramClient } from "@deepgram/sdk";

export const deepgramConnection = async () => {
  try {
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

    return socket;
  } catch (error) {
    throw error;
  }
};
