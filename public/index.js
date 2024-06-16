const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const source = new WebSocket(protocol + "//" + window.location.host + "/ws");

var playerYT;

source.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (!data.type) return console.log("No type found in data", data.type);

  const AllowedTypes = ["NEW_SONG", "GET_CURRENT_SONG", "RESUME_SONG", "PAUSE_SONG"];

  if (!AllowedTypes.includes(data.type)) return console.log("Type not allowed", data.type);

  if (!data.data && data.type === "GET_CURRENT_SONG") return;

  const request = {
    videoId: data.data.videoId,
    title: "Example Video",
    author: "Author Name",
    sender: "Sender Name",
    data: data.data,
  };

  if (!playerYT) return Player(request);

  if (data.type === "NEW_SONG") {
    playerYT.loadVideoById({
      videoId: data.data.videoId,
      startSeconds: Math.floor((Date.now() - data.playingSince) / 1000) + data.seek,
    });
  } else if (data.type === "RESUME_SONG") {
    console.log("Resume song!!!");
    playerYT.seekTo(data.data.seek);
    playerYT.playVideo();
  } else if (data.type === "PAUSE_SONG") {
    console.log("Pause song!!!");
    playerYT.seekTo(data.data.seek);
    playerYT.pauseVideo();
  } else if (data.type === "play-song") {
    console.log("Play song");
  }
};

source.onopen = function () {
  console.log("get current song");
  source.send(JSON.stringify({ type: "GET_CURRENT_SONG" }));
};

source.addEventListener("message", function (event) {
  console.log(event.data);
});
