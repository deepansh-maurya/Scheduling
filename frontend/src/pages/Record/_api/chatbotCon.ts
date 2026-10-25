import { ENV } from "@/lib/get-env";
import { useStore } from "@/store/store";

export class Chatbot {
  static connect(meetingId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(
        `${ENV.VITE_SOCKET_URL}${ENV.VITE_LIVE_MEET_BOT_ENDPOINT}?meetingId=${meetingId}&token=${useStore.getState().accessToken}`
      );

      socket.onopen = () => {
        resolve(socket);
      };

      socket.onclose = () => {
        reject(socket);
      };

      socket.onerror = () => {
        reject(socket);
      };
    });
  }
}
