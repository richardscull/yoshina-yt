/*
 * Some notes:
 * - i KNOW what `ignoreWS` existing is mistake, but it will exist till i make custom controls
 * - i KNOW that `waitForPlayer` is a bad way to wait for player to be ready, but it works (sometimes)
 */

class YoutubePlayer {
  player = null;
  websocket = null;
  isPlaying = true;
  ignoreNextStateChange = false;
  queue = null;

  constructor(elementId, websocket, queueObj) {
    this.websocket = websocket;
    this.queue = queueObj;
    this.bootstrap(elementId);

    console.log("Youtube Player started");
  }

  bootstrap(elementId) {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubePlayerAPIReady = function () {
      const currentRoute = window.location.pathname;
      const isPlayer = currentRoute === "/" ? 1 : 0;

      this.player = new YT.Player(elementId, {
        height: "360",
        width: "640",
        playerVars: {
          autoplay: 1,
          controls: isPlayer ? 1 : 0,
          mute: isPlayer ? 0 : 1,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: this.onPlayerReady.bind(this),
          onStateChange: this.onPlayerStateChange.bind(this),
          onAutoplayBlocked: this.onPlayerAutoplayBlocked.bind(this),
        },
      });
    }.bind(this);
  }

  async ClearPlayer() {
    console.log("Clearing player");

    await this.PlayVideo({}, true); // Clear player
    this.hidePlayer();
  }

  hidePlayer() {
    document.getElementById("app_container").classList.add("hidden");
  }

  onPlayerAutoplayBlocked(event) {
    console.log("Autoplay blocked");
  }

  async PlayVideo(song, ignoreWS = false, toSeek = true) {
    if (ignoreWS) this.ignoreNextStateChange = true;
    document.getElementById("app_container").classList.remove("hidden");

    this.player.loadVideoById({
      videoId: song.videoId,
    });

    await this.waitForPlayer();

    const startFrom = Math.floor((Date.now() - song.playingSince) / 1000) + song.seek;
    if (toSeek) this.player.seekTo(startFrom);

    this.isPlaying = true;

    if (ignoreWS) this.ignoreNextStateChange = false;
  }

  async PauseVideo(seek, ignoreWS = false) {
    if (ignoreWS) this.ignoreNextStateChange = true;

    if (seek) this.player.seekTo(seek);

    await this.player.pauseVideo();
    this.isPlaying = false;

    await this.waitForPlayer();

    if (ignoreWS) this.ignoreNextStateChange = false;
  }

  async ResumeVideo(seek, ignoreWS = false) {
    if (ignoreWS) this.ignoreNextStateChange = true;
    if (seek) this.player.seekTo(seek);

    await this.player.playVideo();
    this.isPlaying = true;

    await this.waitForPlayer();

    if (ignoreWS) this.ignoreNextStateChange = false;
  }

  async setSeek(seek, ignoreWS = false) {
    if (ignoreWS) this.ignoreNextStateChange = true;
    this.player.seekTo(seek);
    await this.waitForPlayer();
    if (ignoreWS) this.ignoreNextStateChange = false;
  }

  setup = false;
  onPlayerReady(event) {
    if (this.setup) return;
    this.websocket.send(JSON.stringify({ type: "GET_CURRENT_SONG" }));
    this.setup = true;
  }

  async waitForPlayer() {
    return new Promise((resolve) => {
      const checkState = () => {
        if (!this.player) return setTimeout(checkState, 100);
        if (typeof this.player.getPlayerState !== "function") return setTimeout(checkState, 100);

        const state = this.player.getPlayerState();
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED) {
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  /*
   * Hours spent in agony trying to make not send ghost
   * messages to the server spent here: 5.5 hours
   *
   * TODO: Just dont use default player controls
   * and make custom ones (play, pause, seek, volume, next)
   */

  onPlayerStateChange(event) {
    if (this.ignoreNextStateChange) {
      return;
    }

    switch (event.data) {
      case YT.PlayerState.PLAYING:
        if (this.isPlaying) return;
        this.isPlaying = true;

        return this.websocket.send(JSON.stringify({ type: "RESUME_SONG", data: { seek: event.target.getCurrentTime() } }));
      case YT.PlayerState.PAUSED:
        if (!this.isPlaying) return;
        this.isPlaying = false;

        return this.websocket.send(JSON.stringify({ type: "PAUSE_SONG", data: { seek: event.target.getCurrentTime() } }));
      case YT.PlayerState.ENDED:
        const currentSongId = this.queue.GetCurrentSong().id;
        return this.websocket.send(JSON.stringify({ type: "NEW_SONG", data: currentSongId }));
    }
  }

  stopVideo() {
    this.player.stopVideo();
  }
}
