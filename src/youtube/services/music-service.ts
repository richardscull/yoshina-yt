import { HandleSongRequestOptions, RequestQueueElement } from "../../types/spotify.types";
import { Log } from "../../utils/log";
import YoutubeClient from "../youtube-client";
import play, { SpotifyTrack } from "play-dl";
import { SongObject } from "../../types/youtube.types";
import { GetValidImage } from "../../utils/check-url";

export const ErrorCodes = {
  IS_PLAYLIST: "Sorry %username% , but I can't play playlists.",
  NO_RESULT: "Sorry %username% , but I can't find this track in YouTube.",
  IS_LIVE: "Sorry %username% , but I can't play live streams.",
  BAD_REQUEST: "Sorry %username% , but I can't find this track.",
  TOO_LONG: "Sorry %username% , but this track is too long. It should be less that 10 minutes.",
  UNTRUSTED: "Sorry %username% , but this track is untrusted. It should have at least 5000 views.",
  IS_EXPLICIT: "Sorry %username% , but this track is explicit. I can't play it.",
};

export default class YoutubeMusicService {
  public youtubeClient: YoutubeClient;
  private isYoutubeFilterEnabled: boolean = true;

  constructor(client: YoutubeClient) {
    this.youtubeClient = client;

    const envFilter = process.env.YOUTUBE_EXPLICIT_FILTER;

    if (envFilter) {
      this.isYoutubeFilterEnabled = envFilter.toLowerCase() === "true";
    }

    Log("Youtube", "Music Service started");

    this.bootstrap();
  }

  public bootstrap() {
    setInterval(async () => {
      if (!this.youtubeClient.requestsQueue.size) return;

      const data: RequestQueueElement = this.youtubeClient.requestsQueue.values().next().value;
      this.youtubeClient.requestsQueue.delete(data);

      const userId = this.youtubeClient.app.twitchClient.user!.id;
      const customRewardId = this.youtubeClient.app.twitchClient.customRewardId!;

      try {
        await this.handleSongRequest({
          user: data.username,
          link: data.message,
        });

        this.youtubeClient.app.twitchClient.apiService.api.channelPoints.updateRedemptionStatusByIds(userId, customRewardId, [data.redeemId], "FULFILLED");
      } catch (err) {
        console.log(err);

        this.youtubeClient.app.twitchClient.chatService.Say(
          `${String(err).replace("%username%", `@${data.username}`)} I will refund you points, so don't worry BlessRNG`
        );

        this.youtubeClient.app.twitchClient.apiService.api.channelPoints.updateRedemptionStatusByIds(userId, customRewardId, [data.redeemId], "CANCELED");
      }
    }, 1000);
  }

  public handleSongRequest({ user, link }: HandleSongRequestOptions) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.youtubeClient.authService.RefreshTokenIfExpired();

        const ytUrl = await this.getSong(link);
        const song = await play.video_basic_info(ytUrl);
        const artists = song.video_details.channel?.name || "Unknown";

        Log("Twitch", `"${artists} - ${song.video_details.title}" was requested by ${user}`);

        this.youtubeClient.app.twitchClient.chatService.Say(
          `@${user} 's track "${artists} - ${song.video_details.title}" ${
            this.youtubeClient.GetQueue().size ? " added to the queue" : " will start playing soon"
          }`
        );

        const request: SongObject = {
          videoId: ytUrl.split("=")[1].split("&")[0],
          requestedBy: user,
          requestedAt: Date.now(),
          title: song.video_details.title || "Unknown",
          duration: song.video_details.durationRaw,
          thumbnail: await GetValidImage(song.video_details.thumbnails),
        };

        await this.addSongToQueue(request);

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async getSong(link: string) {
    const validateType = await play.validate(link);

    switch (validateType) {
      case "sp_track":
        return await this.getSpotifyTrack(link).catch((err) => {
          throw err;
        });
      case "yt_video":
        return await this.getYouTubeTrack(link).catch((err) => {
          throw err;
        });
      case "yt_playlist":
      case "sp_playlist":
        throw ErrorCodes.IS_PLAYLIST;
      default:
        throw ErrorCodes.BAD_REQUEST;
    }
  }

  private async getSpotifyTrack(url: string) {
    const song = await play.spotify(url);

    if (!(song instanceof SpotifyTrack)) throw ErrorCodes.BAD_REQUEST;

    const searchResult = await play.search(`${song.artists[0].name} ${song.name}`, {
      limit: 10,
      source: { youtube: "video" },
    });

    let filteredResult = searchResult.filter((element) => {
      return element.uploadedAt || element.music;
    });

    if (filteredResult.length === 0) throw ErrorCodes.NO_RESULT;

    filteredResult.filter((element) => {
      return element.durationInSec < 600;
    });

    if (filteredResult.length === 0) throw ErrorCodes.TOO_LONG;

    if (this.isYoutubeFilterEnabled) {
      filteredResult = filteredResult.filter((element) => {
        return element.views >= 5000;
      });
    }

    if (filteredResult.length === 0) throw ErrorCodes.UNTRUSTED;

    return filteredResult[0].url;
  }

  private async getYouTubeTrack(url: string) {
    const videoData = await play.video_info(url).catch((err) => {
      if (err.message.includes("Sign in to confirm your age")) throw ErrorCodes.IS_EXPLICIT;
      throw ErrorCodes.BAD_REQUEST;
    });

    if (videoData.LiveStreamData.isLive) throw ErrorCodes.IS_LIVE;
    if (videoData.video_details.durationInSec > 600) throw ErrorCodes.TOO_LONG;
    if (this.isYoutubeFilterEnabled && videoData.video_details.views < 5000) throw ErrorCodes.UNTRUSTED;

    return videoData.video_details.url;
  }

  private addSongToQueue(request: SongObject) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const isCurrentSongEmpty = !this.youtubeClient.GetCurrentSong();

        this.youtubeClient.AddSongToQueue(request);

        if (isCurrentSongEmpty) {
          const song = this.youtubeClient.GetCurrentSong();

          if (song) this.youtubeClient.websocketService.SendNewSong(song);
        }

        return resolve(true);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  public async GetDataFromCurrentSong() {
    return this.youtubeClient.GetCurrentSong();
  }
}
