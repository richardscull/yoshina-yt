import SpotifyWebApiClient from "spotify-web-api-node";
import { Log } from "../../utils/log";
import play, { refreshToken } from "play-dl";
import { readJsonFile, writeJsonFile } from "../../utils/read-write-file";
import chalk from "chalk";
import { object, string } from "zod";

export default class SpotifyAuthService {
  private api = new SpotifyWebApiClient({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URL,
  });

  constructor() {
    this.bootstrap();

    Log("Youtube", "Spotify Auth Service started");
  }

  private async bootstrap() {
    const jsonFile = await readJsonFile<{
      refreshToken: string;
    }>({
      path: "./data/spotify-creds.json",
      schema: object({
        refreshToken: string(),
      }),
    });

    if (!jsonFile) return this.getAuthUrl();

    await this.updateCreds(jsonFile.refreshToken);

    Log("Youtube", "Spotify Auth Service credentials set");
  }

  private getAuthUrl() {
    const authUrl = this.api.createAuthorizeURL([], "NO-STATE");

    Log("Spotify", `You need to authorize first!\nUse this url:\n${chalk.cyanBright(authUrl)}`);
  }

  public async SetRefreshToken(code: string) {
    const { body } = await this.api.authorizationCodeGrant(code);

    writeJsonFile({
      path: "./data/spotify-creds.json",
      data: {
        refreshToken: body.refresh_token,
      },
    });

    await this.updateCreds(body.refresh_token);

    Log("Youtube", "Spotify Token set");
  }

  public async RefreshTokenIfExpired() {
    if (!play.is_expired()) return;

    await play.refreshToken();

    Log("Youtube", "Spotify Token refreshed");
  }

  private async updateCreds(refreshToken: string) {
    const credentionals = this.api.getCredentials();

    await play.setToken({
      spotify: {
        client_id: credentionals.clientId!,
        client_secret: credentionals.clientSecret!,
        refresh_token: refreshToken,
        market: "US",
      },
    });

    // Note: This is a workaround for the play-dl library to register expiration time
    await play.refreshToken();
  }
}
