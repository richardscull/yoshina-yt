import { WebServer } from "./server/server-client";
import { TwitchClient } from "./twitch/twitch-client";
import "./utils/check-env";
import YoutubeClient from "./youtube/youtube-client";

export class App {
  public webServer: WebServer;

  public twitchClient!: TwitchClient;
  public youtubeClient: YoutubeClient;

  constructor() {
    this.webServer = new WebServer(this);
    this.youtubeClient = new YoutubeClient(this);
    this.twitchClient = new TwitchClient(this);
  }

  public bootstrap() {
    this.bootstrapTwitchClient();
  }

  private bootstrapTwitchClient() {
    let intervalId = setInterval(() => {
      this.twitchClient.bootstrap();

      clearInterval(intervalId);
    }, 2000);
  }
}

const app = new App();

app.bootstrap();
