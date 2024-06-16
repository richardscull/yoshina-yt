function Player(request) {
  const { videoId, title, author, sender, elementId, data } = request;
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // TODO: UPDATE
  const startPlayFrom = Math.floor((Date.now() - data.playingSince) / 1000) + data.seek;

  function play() {
    playerYT = new YT.Player("player", {
      height: "390",
      width: "640",
      videoId: videoId,
      start: Math.floor((Date.now() - data.playingSince) / 1000) + data.seek,
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
    console.log("Player ready", data.isPlaying);
    if (data.isPlaying) {
      console.log(startPlayFrom);
      playerYT.seekTo(startPlayFrom);
      event.target.playVideo();
      return;
    } else {
      if (data.seek > 0) {
        playerYT.seekTo(data.seek);
        event.target.pauseVideo();
      } else {
        source.send(JSON.stringify({ type: "RESUME_SONG", data: { seek: 0 } }));
      }
    }
  }

  let isPlaying = true;
  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
      source.send(JSON.stringify({ type: "NEW_SONG" }));
    } else if (event.data == YT.PlayerState.PAUSED) {
      isPlaying = false;
      source.send(JSON.stringify({ type: "PAUSE_SONG", data: { seek: event.target.getCurrentTime() } }));
    } else if (event.data == YT.PlayerState.PLAYING && !isPlaying) {
      isPlaying = true;
      source.send(JSON.stringify({ type: "RESUME_SONG", data: { seek: event.target.getCurrentTime() } }));
    }
  }

  function stopVideo() {
    playerYT.stopVideo();
  }
}
