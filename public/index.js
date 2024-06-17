const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const websocket = new WebSocket(protocol + "//" + window.location.host + "/ws");

const elementId = "player";
const queueObj = new QueueManager(websocket);
const playerYT = new YoutubePlayer(elementId, websocket, queueObj);

websocket.onmessage = async function (event) {
  const dataPayload = JSON.parse(event.data);
  if (!dataPayload.type) return console.log("No type found in data", dataPayload.type);

  const AllowedTypes = ["NEW_SONG", "PAUSE_SONG", "RESUME_SONG", "CHANGE_VOLUME", "UPDATE_QUEUE", "MESSAGE", "GET_CURRENT_SONG"];
  if (!AllowedTypes.includes(dataPayload.type)) return console.log("Type not allowed", dataPayload.type);

  const { data, type } = dataPayload;

  console.log("Received message from server", dataPayload);

  switch (type) {
    case "NEW_SONG":
      if (!data) {
        // No song is playing and no song in queue
        await playerYT.PauseVideo(0, true);
        return await playerYT.HidePlayer();
      }

      return await playerYT.PlayVideo(data, true);
    case "GET_CURRENT_SONG":
      if (!data) break; // No song is playing

      await playerYT.PlayVideo(data, true, false);
      if (!data.isPlaying) {
        if (data.seek > 0) {
          await playerYT.PauseVideo();
        } else {
          websocket.send(JSON.stringify({ type: "RESUME_SONG", data: { seek: 0 } }));
          break;
        }
      }

      const seekTo = data.isPlaying ? Math.floor((Date.now() - data.playingSince) / 1000) + data.seek : data.seek;
      await playerYT.setSeek(seekTo, true);

      break;
    case "RESUME_SONG":
      await playerYT.ResumeVideo(data.seek, true);
      break;
    case "PAUSE_SONG":
      await playerYT.PauseVideo(data.seek, true);
      break;
    case "UPDATE_QUEUE":
      queueObj.UpdateQueue(data);
      break;
    case "MESSAGE":
      console.log(`Message from server: ${data}`);
      break;
  }
};

websocket.onopen = function () {
  websocket.send(JSON.stringify({ type: "GET_QUEUE" }));
};
