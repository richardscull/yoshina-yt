import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyWebsocket, { WebSocket } from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { App } from "../app";
import { RoutesConst } from "./constants";
import { ServerMessage, ServerMessageType } from "../types/websocket.types";
import { Log } from "../utils/log";
import chalk from "chalk";

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
    this.server.get(RoutesConst.WIDGET, this.widgetHandler.bind(this));
    this.server.get(RoutesConst.QUEUE, this.queueHandler.bind(this));

    this.server.get(RoutesConst.SPOTI_CODE, this.spotifyCodeHandler.bind(this));
    this.server.get(RoutesConst.TWITCH_CODE, this.twitchCodeHandler.bind(this));

    this.startServer();
  }

  private widgetHandler(_: FastifyRequest, res: FastifyReply) {
    return res.sendFile("routes/widget/index.html");
  }

  private queueHandler(_: FastifyRequest, res: FastifyReply) {
    return res.sendFile("routes/queue/index.html");
  }

  private playerHandler(_: FastifyRequest, res: FastifyReply) {
    return res.sendFile("routes/main/index.html");
  }

  private websocketHandler(connection: WebSocket, _: FastifyRequest) {
    this.websocketClients.add(connection);

    const data: ServerMessage = {
      type: ServerMessageType.MESSAGE,
      data: "Hello from server o/",
    };

    connection.send(JSON.stringify(data));

    let isReadyToPause = true; // Prevents from spamming pause

    connection.on("message", (message: any) => {
      message = JSON.parse(message) as ServerMessage;

      if (!message.type) return;

      const TypesWithoutData = [ServerMessageType.GET_CURRENT_SONG, ServerMessageType.GET_QUEUE];

      if (!TypesWithoutData.includes(message.type) && !message.data) return;

      // Log("WebSocket", `Received message with type: ${message.type}`);

      switch (message.type) {
        case ServerMessageType.NEW_SONG:
          const currentPlayerSongId = message.data;

          if (currentPlayerSongId !== this.app.youtubeClient.GetCurrentSong()?.id) return;

          this.app.youtubeClient.websocketService.NextSong();

          break;
        case ServerMessageType.PAUSE_SONG:
          if (!isReadyToPause) return;
          this.app.youtubeClient.websocketService.SendPauseSong(message.data?.seek || 0);
          isReadyToPause = false;
          setTimeout(() => {
            isReadyToPause = true;
          }, 500);
          break;
        case ServerMessageType.RESUME_SONG:
          this.app.youtubeClient.websocketService.SendResumeSong(message.data?.seek || 0);
          break;
        case ServerMessageType.REMOVE_SONG:
          const song = message.data;

          if (song.id === this.app.youtubeClient.GetCurrentSong()?.id) {
            this.app.youtubeClient.websocketService.NextSong();
            // We don't need to send update queue, because NextSong will do it
          } else {
            this.app.youtubeClient.websocketService.SendUpdateQueue("REMOVE", { song: message.data });
          }
          break;
        case ServerMessageType.GET_QUEUE:
          this.app.youtubeClient.websocketService.SendUpdateQueue("SET", { connection });
          break;
        case ServerMessageType.GET_CURRENT_SONG:
          this.app.youtubeClient.websocketService.SendCurrentSong(connection);
          break;
        case ServerMessageType.MESSAGE:
          Log("WebSocket", `Got message: ${message.data}`);
          break;
        default:
          console.log("Unknown message type", message.type);
      }
    });

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

  private async startServer() {
    if (!this.serverStarted) {
      this.serverStarted = new Date();
      this.server.listen({
        port: Number(process.env.AUTH_SERVER_PORT),
      });

      const open = Function('return import("open")')() as Promise<typeof import("open") | any>;
      (await open).openApp(`http://localhost:${process.env.AUTH_SERVER_PORT}`);

      const coloredLink = chalk.cyanBright(`http://localhost:${process.env.AUTH_SERVER_PORT}`);
      Log("Server", `Server started on ${coloredLink}, feel free to open it in your browser!`);
    }
  }
}
