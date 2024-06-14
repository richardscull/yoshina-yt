import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyWebsocket, { WebSocket } from "@fastify/websocket";
import { App } from "../app";
import { RoutesConst } from "./constants";

export class AuthServer {
  public app: App;

  private server = fastify();
  private serverStarted?: Date;

  private twitchCodeReceived?: Date;
  private spotifyCodeReceived?: Date;

  private autoCloseHtml = `<html><script>window.close()</script></html>`;

  constructor(app: App) {
    this.app = app;

    this.server.register(fastifyWebsocket);

    this.server.get(RoutesConst.WEBSOCKET_PATH, { websocket: true }, this.websocketHandler.bind(this));
    this.server.get(RoutesConst.PLAYER, this.playerHandler.bind(this));

    this.server.get(RoutesConst.SPOTI_CODE, this.spotifyCodeHandler.bind(this));
    this.server.get(RoutesConst.TWITCH_CODE, this.twitchCodeHandler.bind(this));

    this.startServer();
  }

  /**
   * HTML page with a song player that will be used to play songs
   */
  private playerHandler(req: FastifyRequest, res: FastifyReply) {
    // todo: implement
  }

  private websocketHandler(socket: WebSocket, req: FastifyRequest) {
    // todo: handle song requests
  }

  private spotifyCodeHandler(req: FastifyRequest, res: FastifyReply) {
    this.spotifyCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string;
    };

    this.app.spotifyClient.authService.authWithCode(query.code);
  }

  private twitchCodeHandler(req: FastifyRequest, res: FastifyReply) {
    this.twitchCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string;
    };

    this.app.twitchClient.getTokensFromCode(query.code);
  }

  private startServer() {
    if (!this.serverStarted) {
      this.serverStarted = new Date();
      this.server.listen({
        port: Number(process.env.AUTH_SERVER_PORT),
      });
    }
  }
}
