import { useStore } from "@/store/store";

export class Socket {
  static liveMeetCon: WebSocket | null = null;

  static conenctMeeting(meetingId: string) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(
        import.meta.env.VITE_SOCKET_URL +
          `/live-meeting?meetingId=${meetingId}&token=${useStore.getState().accessToken}`
      );

      socket.addEventListener("open", () => {
        this.liveMeetCon = socket;

        resolve(socket);
      });

      socket.addEventListener("error", () => {
        reject(new Error("WebSocket connection failed"));
      });
    });
  }
}
