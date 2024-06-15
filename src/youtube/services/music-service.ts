import { request } from "http";
import { HandleSongRequestOptions, RequestQueueElement } from "../../types/spotify.types";
import { Log } from "../../utils/log";
import YoutubeClient from "../youtube-client";
import play, { SpotifyTrack } from "play-dl";
import e from "express";

export const ErrorCodes = {
  IS_PLAYLIST: "Sorry %username% , but I can't play playlists.",
  NO_RESULT: "Sorry %username% , but I can't find this track in YouTube.",
  IS_LIVE: "Sorry %username% , but I can't play live streams.",
  BAD_REQUEST: "Sorry %username% , but I can't find this track.",
};

export default class YoutubeMusicService {
  public youtubeClient: YoutubeClient;

  constructor(client: YoutubeClient) {
    this.youtubeClient = client;

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
            this.youtubeClient.songsQueue.size ? " added to the queue" : " will start playing soon"
          }`
        );

        // todo: ws send play song
        this.youtubeClient.songsQueue.add({
          user,
          link: ytUrl,
        });

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
        return await this.getSpotifyTrack(link).catch(() => {
          throw ErrorCodes.BAD_REQUEST;
        });
      case "yt_video":
        return await this.getYouTubeTrack(link).catch(() => {
          throw ErrorCodes.BAD_REQUEST;
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

    const filteredResult = searchResult.filter((element) => {
      return element.uploadedAt || element.music;
    });

    if (filteredResult.length === 0) throw ErrorCodes.NO_RESULT;

    return filteredResult[0].url;
  }

  private async getYouTubeTrack(url: string) {
    const videoData = await play.video_info(url).catch(() => {
      throw ErrorCodes.BAD_REQUEST;
    });

    if (videoData.LiveStreamData.isLive) throw ErrorCodes.IS_LIVE;

    return url;
  }

  // todo: ws send play song
  private playSong(link: string) {
    // return new Promise<PlaySongReturn>(async (resolve, reject) => {
    //   try {
    //     const devicesResponse = await this.spotifyClient.api.getMyDevices();
    //     if (!devicesResponse.body.devices.length) return reject();
    //     const trackId = getTrackIdFromLink(link);
    //     const trackResponse = await this.spotifyClient.api.getTrack(trackId!);
    //     let isQueue = false;
    //     if (!trackResponse.body) return reject();
    //     const isPlaying = await this.checkIsPlaying();
    //     switch (isPlaying) {
    //       case true:
    //         await this.spotifyClient.api.addToQueue(this.createTrackUri(trackResponse.body.id));
    //         isQueue = true;
    //         break;
    //       case false:
    //         await this.spotifyClient.api.play({
    //           uris: [this.createTrackUri(trackResponse.body.id)],
    //         });
    //         break;
    //     }
    //     resolve({ isQueue, song: trackResponse.body });
    //   } catch (err) {
    //     console.log(err);
    //     reject(err);
    //   }
    // });
  }

  public async GetDataFromCurrentSong() {
    const currentSong = this.youtubeClient.currentSong;

    if (!currentSong) {
      return {
        isPlaying: false,
        title: "",
        requestBy: "",
      };
    } else {
      const data = await play.video_info(currentSong.link);
      return {
        isPlaying: true,
        title: data.video_details.title,
        requestBy: currentSong.user,
      };
    }
  }
}
