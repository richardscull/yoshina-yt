function Player(request) {
  const { videoId, title, author, sender, requestedAt, elementId } = request;
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  const startPlayFrom = Math.floor((new Date().getTime() - requestedAt) / 1000);
 
  function play() {
    playerYT = new YT.Player("player", {
      height: "390",
      width: "640",
      videoId: videoId,
      start: Math.floor((new Date().getTime() - requestedAt) / 1000),
      playerVars: {
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onAutoplayBlocked: onPlayerAutoplayBlocked,
      },
    });
  }

  window.onYouTubePlayerAPIReady = function () {
    play();
  };

  function onPlayerAutoplayBlocked(event) {
    console.log("Autoplay blocked");
  }

  function onPlayerReady(event) {
    playerYT.seekTo(startPlayFrom);
    event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
      source.send(JSON.stringify({ type: "NEW_SONG" }));
    }
  }

  function stopVideo() {
    playerYT.stopVideo();
  }
}
