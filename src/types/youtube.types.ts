export interface SongObject {
  title: string;
  videoId: string;
  requestedBy: string;
  thumbnail?: string;
  duration?: string;
}

export type TrackShortInfo = {
  index?: number;
  title: string;
  url: string;
  duration: number;
};
