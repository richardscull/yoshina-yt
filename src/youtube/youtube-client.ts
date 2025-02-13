import { App } from "../app";
import { Log } from "../utils/log";
import { RequestQueueElement } from "../types/spotify.types";
import YoutubeMusicService from "./services/music-service";
import YoutubeAuthService from "./services/auth-service";
import { CurrentSong, SongObject } from "../types/youtube.types";
import YoutubeWebSocketService from "./services/ws-service";

export default class YoutubeClient {
  public app: App;

  public musicService: YoutubeMusicService;
  public authService: YoutubeAuthService;
  public websocketService: YoutubeWebSocketService;

  public requestsQueue: Set<RequestQueueElement> = new Set();
  private songsQueue: Set<SongObject> = new Set();
  private currentSong: CurrentSong | null = null;

  constructor(app: App) {
    this.app = app;

    this.authService = new YoutubeAuthService();
    this.websocketService = new YoutubeWebSocketService(this);
    this.musicService = new YoutubeMusicService(this);

    Log("Youtube", "Youtube Client started");
  }

  public AddSongToQueue(song: SongObject) {
    this.songsQueue.add(song);

    this.app.youtubeClient.websocketService.SendUpdateQueue("ADD", { song });

    if (!this.currentSong) {
      this.PopSongFromQueue();
    }

    return this.songsQueue;
  }

  public PopSongFromQueue() {
    const hasListeners = this.app.webServer.websocketClients.size > 0;

    this.app.youtubeClient.websocketService.SendUpdateQueue("REMOVE", { song: this.currentSong as SongObject });

    if (this.songsQueue.size <= 0) {
      this.currentSong = null;
    } else {
      const nextSong = this.songsQueue.values().next().value;
      this.songsQueue.delete(nextSong!);

      this.currentSong = {
        ...(nextSong as SongObject),
        playingSince: hasListeners ? Date.now() : 0,
        isPlaying: hasListeners ? true : false,
        seek: 0,
      };
    }

    return this.currentSong;
  }

  public UpdateCurrentSongStatus({ isPlaying, seek }: { isPlaying: boolean; seek: number }) {
    if (!this.currentSong) return;

    this.currentSong.isPlaying = isPlaying;
    this.currentSong.seek = seek;
    this.currentSong.playingSince = isPlaying ? Date.now() : 0;

    return this.currentSong;
  }

  public GetCurrentSong() {
    return this.currentSong;
  }

  public GetQueue() {
    return this.songsQueue;
  }
}
