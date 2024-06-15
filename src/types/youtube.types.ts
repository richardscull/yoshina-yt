export interface SongObject {
  user: string;
  link: string;
}

export type TrackShortInfo = {
  index?: number;
  title: string;
  url: string;
  duration: number;
};
