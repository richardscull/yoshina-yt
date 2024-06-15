import { AuthServer } from "./server/server-client";
import { TwitchClient } from "./twitch/twitch-client";
import "./utils/check-env";
import YoutubeClient from "./youtube/youtube-client";

export class App {
  public authServer: AuthServer;

  public twitchClient!: TwitchClient;
  public youtubeClient: YoutubeClient;

  constructor() {
    this.authServer = new AuthServer(this);
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
