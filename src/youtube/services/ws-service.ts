import { Log } from "../../utils/log";
import YoutubeClient from "../youtube-client";
import { SongObject } from "../../types/youtube.types";
import { WebSocket } from "@fastify/websocket";
import { ServerMessage, ServerMessageType } from "../../types/websocket.types";

export default class YoutubeWebSocketService {
  public youtubeClient!: YoutubeClient;

  private websocketClients: Set<WebSocket>;

  constructor(client: YoutubeClient) {
    this.youtubeClient = client;
    this.websocketClients = client.app.webServer.websocketClients;

    Log("Youtube", "WebSocket Service started");
  }

  public async NextSong() {
    Log("WebSocket", "Trying to send next song to clients");

    const song = this.youtubeClient.PopSongFromQueue();

    if (!song) {
      Log("WebSocket", "Couldn't set next song in queue");

      return;
    }

    this.SendNewSong(song);
  }

  // TODO: Should also send queue if it's not empty
  public SendNewSong(request: SongObject & { requestedAt: number }) {
    Log("WebSocket", "Sending new song to clients");

    const data: ServerMessage = {
      type: ServerMessageType.NEW_SONG,
      data: request,
    };

    this.sendDataToClients(data);
  }

  public SendCurrentSong() {
    Log("WebSocket", "Sending current song to clients");

    const song = this.youtubeClient.GetCurrentSong();

    const data: ServerMessage = {
      type: ServerMessageType.GET_CURRENT_SONG,
      data: song,
    };

    this.sendDataToClients(data);
  }

  private sendDataToClients(data: ServerMessage) {
    this.websocketClients.forEach((client) => {
      client.send(JSON.stringify(data));
    });
  }
}
