import { SongObject } from "./youtube.types";

export interface ServerMessage {
  type: ServerMessageType;
  data: SongObject | UpdatePlayState | UpdateVolume | UpdateQueue | string | null;
}

export enum ServerMessageType {
  NEW_SONG = "NEW_SONG", // Update YT player with new song
  PAUSE_SONG = "PAUSE_SONG", // Pause YT player
  RESUME_SONG = "RESUME_SONG", // Resume YT player
  CHANGE_VOLUME = "CHANGE_VOLUME", // Change YT player volume
  UPDATE_QUEUE = "UPDATE_QUEUE", // Update queue element (e.g. add/remove element)
  MESSAGE = "MESSAGE", // Send a message to the client (e.g. console/error message)
  GET_CURRENT_SONG = "GET_CURRENT_SONG", // Get current song from YT player
  GET_QUEUE = "GET_QUEUE", // Get current queue from YT player
}

export interface UpdatePlayState {
  seek: number;
}

export interface UpdateVolume {
  volume: number;
}

export interface UpdateQueue {
  state: "ADD" | "REMOVE" | "SET";
  song?: SongObject;
  queue?: SongObject[];
}
