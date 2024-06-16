import { Log } from "../../utils/log";
import YoutubeClient from "../youtube-client";
import { CurrentSong } from "../../types/youtube.types";
import { WebSocket } from "@fastify/websocket";
import { ServerMessage, ServerMessageType, UpdatePlayState } from "../../types/websocket.types";

export default class YoutubeWebSocketService {
  public youtubeClient!: YoutubeClient;

  private websocketClients: Set<WebSocket>;

  constructor(client: YoutubeClient) {
    this.youtubeClient = client;
    this.websocketClients = client.app.webServer.websocketClients;

    Log("Youtube", "WebSocket Service started");
  }

  public SendPauseSong(seek: number) {
    Log("WebSocket", "Sending pause song to clients");

    this.youtubeClient.UpdateCurrentSongStatus({
      isPlaying: false,
      seek,
    });

    const data: ServerMessage = {
      type: ServerMessageType.PAUSE_SONG,
      data: {
        seek,
      } as UpdatePlayState,
    };

    this.sendDataToClients(data);
  }

  public SendResumeSong(seek: number) {
    Log("WebSocket", "Sending resume song to clients");

    this.youtubeClient.UpdateCurrentSongStatus({
      isPlaying: true,
      seek,
    });

    const data: ServerMessage = {
      type: ServerMessageType.RESUME_SONG,
      data: {
        seek,
      } as UpdatePlayState,
    };

    this.sendDataToClients(data);
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
  public SendNewSong(request: CurrentSong) {
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
