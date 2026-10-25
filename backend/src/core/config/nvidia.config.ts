import axios from "axios";
import { emitter } from "./event.config";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

type Role = "user" | "system" | "assistant";

export interface LlmMessage {
  role: Role;
  content: string;
}

type Model = "nvidia/nemotron-3.5-super-vl-120b-a12b";

const configOptions = {
  max_tokens: 4096,
  seed: 0,
  stream: true,
  temperature: 0.7
};

export class Llm {
  static async call(
    messages: LlmMessage[],
    model: Model = "nvidia/nemotron-3.5-super-vl-120b-a12b",
    config: typeof configOptions = configOptions,
    eventName?: string
  ) {
    try {
      const response = await axios.post(
        invokeUrl,
        { ...config, model, messages },
        {
          headers: {
            Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
            "Content-Type": "application/json",
            Accept: config.stream ? "text/event-stream" : "application/json"
          },
          responseType: config.stream ? "stream" : "json"
        }
      );

      if (config.stream) {
        return await new Promise<string>((resolve, reject) => {
          let result = "";
          let buffer = "";

          response.data.on("data", (chunk: Buffer) => {
            buffer += chunk.toString();

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const value = line.slice(6).trim();

              if (!value || value === "[DONE]") continue;

              try {
                const parsed = JSON.parse(value);
                result += parsed.choices?.[0]?.delta?.content ?? "";
              } catch (error) {
                console.error("Failed to parse SSE chunk:", error);
              }
            }
          });

          response.data.on("end", () => resolve(result));
          response.data.on("error", reject);
        });
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("NVIDIA status:", error.response?.status);
        console.error("NVIDIA response:", error.response?.data);
      } else {
        console.error("LLM error:", error);
      }

      throw error;
    }
  }
}
