import { WebSocketServer } from "ws";

export const wsLiveMeet = new WebSocketServer({ noServer: true });
export const wsChatbot = new WebSocketServer({ noServer: true });
