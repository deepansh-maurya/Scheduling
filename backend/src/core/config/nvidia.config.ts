import axios from "axios";
import { emitter } from "./event.config";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = true;

const headers = {
  Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  Accept: stream ? "text/event-stream" : "application/json"
};

const configOptions = {
  max_tokens: 16384,
  seed: 0,
  stream: stream,
  temperature: 1,
  reasoning_effort: "max"
};

type Role = "user" | "system" | "model";

export interface LlmMessage {
  role: Role;
  content: string;
}

type Model = "moonshotai/kimi-k3";

export class Llm {
  static async call(
    message: LlmMessage[],
    model: Model = "moonshotai/kimi-k3",
    config: typeof configOptions = configOptions,
    eventName?: string
  ) {
    try {
      const payload = {
        messages: message,
        ...config,
        model
      };

      const response = await axios.post(invokeUrl, payload, {
        headers: headers,
        responseType: config.stream ? "stream" : "json"
      });

      if (config.stream && eventName) {
        response.data.on("data", (chunk: any) => {
          console.log(chunk.toString());
          emitter.emit(eventName, chunk.toString());
        });
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
