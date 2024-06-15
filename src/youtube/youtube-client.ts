import { App } from "../app";
import { Log } from "../utils/log";
import { RequestQueueElement } from "../types/spotify.types";
import YoutubeMusicService from "./services/music-service";
import YoutubeAuthService from "./services/auth-service";
import { SongObject } from "../types/youtube.types";

export default class YoutubeClient {
  public app: App;

  public musicService: YoutubeMusicService;
  public authService: YoutubeAuthService;

  public requestsQueue: Set<RequestQueueElement> = new Set();
  public songsQueue: Set<SongObject> = new Set();
  public currentSong?: SongObject;

  constructor(app: App) {
    this.app = app;

    this.authService = new YoutubeAuthService();
    this.musicService = new YoutubeMusicService(this);

    Log("Youtube", "Youtube Client started");
  }
}
