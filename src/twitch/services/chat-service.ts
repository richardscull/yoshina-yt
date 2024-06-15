import { ChatClient } from "@twurple/chat";
import { TwitchClient } from "../twitch-client";
import { Log } from "../../utils/log";

export class TwitchChatService {
  public twitchClient: TwitchClient;
  public chat: ChatClient;

  constructor(client: TwitchClient) {
    this.twitchClient = client;

    this.chat = new ChatClient({
      authProvider: this.twitchClient.authService.authProvider,
      channels: [process.env.TWITCH_CHANNEL!],
    });

    this.chat.connect();
    this.chat.onMessage(this.SendCurrentSong.bind(this));

    Log("Twitch", "Chat Client started");
  }

  public async SendCurrentSong(__: string, user: string, text: string) {
    if (!this.twitchClient.user) return Log("Twitch", "Cannot send message, because user was not found");
    if (text !== "!current") return;

    const data = await this.twitchClient.app.youtubeClient.musicService.GetDataFromCurrentSong();

    data.isPlaying ? this.Say(`@${user} , Current song: "${data.title}" requested by ${data.requestBy}`) : this.Say(`@${user} , No song is currently playing`);
  }

  public Say(message: string) {
    const channel = this.twitchClient.user?.name;

    if (!channel) return Log("Twitch", "Cannot send message, because channel was not found");

    this.chat.say(channel, message.slice(0, 500));
  }
}
