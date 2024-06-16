import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyWebsocket, { WebSocket } from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { App } from "../app";
import { RoutesConst } from "./constants";

export class WebServer {
  public app: App;
  public websocketClients: Set<WebSocket> = new Set();

  private server = fastify();
  private serverStarted?: Date;

  private twitchCodeReceived?: Date;
  private spotifyCodeReceived?: Date;

  // FIXME: Migration to fastify broke it. Need to fix it
  private autoCloseHtml = `<body><script>window.close()</script></body>`;

  constructor(app: App) {
    this.app = app;

    this.server.register(fastifyWebsocket);
    this.server.register(fastifyStatic, {
      root: `${__dirname}/../../public`,
      prefix: "/",
    });

    this.server.register((_, __, done) => {
      this.server.get(RoutesConst.WEBSOCKET_PATH, { websocket: true }, this.websocketHandler.bind(this));
      done();
    });

    this.server.get(RoutesConst.PLAYER, this.playerHandler.bind(this));

    this.server.get(RoutesConst.SPOTI_CODE, this.spotifyCodeHandler.bind(this));
    this.server.get(RoutesConst.TWITCH_CODE, this.twitchCodeHandler.bind(this));

    this.startServer();
  }

  private playerHandler(req: FastifyRequest, res: FastifyReply) {
    return res.sendFile("index.html");
  }

  private websocketHandler(connection: WebSocket, _: FastifyRequest) {
    this.websocketClients.add(connection);
    connection.send("Hello from server o/");

    connection.on("close", () => {
      this.websocketClients.delete(connection);
    });
  }

  private spotifyCodeHandler(req: FastifyRequest, res: FastifyReply) {
    this.spotifyCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string | undefined;
    };

    if (!query.code) throw new Error("No code received");

    this.app.youtubeClient.authService.SetRefreshToken(query.code);
  }

  private twitchCodeHandler(req: FastifyRequest, res: FastifyReply) {
    this.twitchCodeReceived = new Date();

    res.send(this.autoCloseHtml);
    const query = req.query as {
      code: string | undefined;
    };

    if (!query.code) throw new Error("No code received");

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
