const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const source = new WebSocket(protocol + "//" + window.location.host + "/ws");

var playerYT;

source.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (data.type !== "NEW_SONG" && data.type !== "GET_CURRENT_SONG") return;

  if (!data.data && data.type === "GET_CURRENT_SONG") return;

  const request = {
    videoId: data.data.videoId,
    title: "Example Video",
    author: "Author Name",
    sender: "Sender Name",
    requestedAt: data.data.requestedAt,
    elementId: "video_player",
  };

  if (!playerYT) return Player(request);

  if (data.type === "NEW_SONG") {
    playerYT.loadVideoById({
      videoId: data.data.videoId,
      startSeconds: Math.floor((new Date().getTime() - data.data.requestedAt) / 1000),
    });
  }

  if (data.type === "play-song") {
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
