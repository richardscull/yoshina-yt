export interface SongObject {
  title: string;
  videoId: string;
  requestedBy: string;
  requestedAt: number;
  thumbnail?: string;
  duration?: string;
}

export type TrackShortInfo = {
  index?: number;
  title: string;
  url: string;
  duration: number;
};

export interface CurrentSong extends SongObject {
  playingSince: number;
  isPlaying: boolean;
  seek: number;
}
