import fastify, { FastifyRequest, FastifyReply } from "fastify";
import { App } from "../app";
import { RoutesConst } from "./constants";

//type RunningServer = ReturnType<Application["listen"]>;

export class AuthServer {
  public app: App;

  private server = fastify();
  private serverStarted?: Date;

  private twitchCodeReceived?: Date;
  private spotifyCodeReceived?: Date;

  private autoCloseHtml = `<html><script>window.close()</script></html>`;

  constructor(app: App) {
    this.app = app;

    this.server.get(RoutesConst.SPOTI_CODE, this.handleSpotifyCode.bind(this));
    this.server.get(RoutesConst.TWITCH_CODE, this.handleTwitchCode.bind(this));
  }

  public startServer() {
    if (!this.serverStarted) {
      this.serverStarted = new Date();
      this.server.listen({
        port: Number(process.env.AUTH_SERVER_PORT),
      });
    }
  }

  private handleSpotifyCode(req: FastifyRequest, res: FastifyReply) {
    this.spotifyCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string;
    };

    this.app.spotifyClient.authService.authWithCode(query.code);
  }

  private handleTwitchCode(req: FastifyRequest, res: FastifyReply) {
    this.twitchCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string;
    };

    this.app.twitchClient.getTokensFromCode(query.code);
  }
}
