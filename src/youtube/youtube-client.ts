import { App } from "../app";
import { Log } from "../utils/log";
import { RequestQueueElement } from "../types/spotify.types";
import YoutubeMusicService from "./services/music-service";
import YoutubeAuthService from "./services/auth-service";
import { SongObject } from "../types/youtube.types";
import YoutubeWebSocketService from "./services/ws-service";

export default class YoutubeClient {
  public app: App;

  public musicService: YoutubeMusicService;
  public authService: YoutubeAuthService;
  public websocketService: YoutubeWebSocketService;

  public requestsQueue: Set<RequestQueueElement> = new Set();
  private songsQueue: Set<SongObject> = new Set();
  private currentSong: (SongObject & { requestedAt: number }) | null = null;

  constructor(app: App) {
    this.app = app;

    this.authService = new YoutubeAuthService();
    this.websocketService = new YoutubeWebSocketService(this);
    this.musicService = new YoutubeMusicService(this);

    Log("Youtube", "Youtube Client started");
  }

  public AddSongToQueue(song: SongObject) {
    this.songsQueue.add(song);

    if (!this.currentSong) {
      this.PopSongFromQueue();
    }

    return this.songsQueue;
  }

  public PopSongFromQueue() {
    if (this.songsQueue.size <= 0) {
      this.currentSong = null;
    } else {
      const nextSong = this.songsQueue.values().next().value;
      this.songsQueue.delete(nextSong);

      this.currentSong = {
        ...nextSong,
        requestedAt: new Date().getTime(),
      };
    }

    return this.currentSong;
  }

  public GetCurrentSong() {
    return this.currentSong;
  }

  public GetQueue() {
    return this.songsQueue;
  }
}
