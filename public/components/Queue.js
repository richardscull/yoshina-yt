class QueueManager {
  listElement = document.getElementById("queue");
  queue = [];

  constructor() {
    console.log("Queue Manager started");
  }

  UpdateQueue(data) {
    switch (data.state) {
      case "ADD":
        this.add(data.song);
        break;
      case "REMOVE":
        this.remove(data.song);
        break;
      case "SET":
        for (const song of data.queue) {
          this.add(song);
        }
    }
  }

  add(song) {
    if (!song) return;
    const element = this.createListItem(song);
    const id = `${song.requestedBy}-${song.requestedAt}`;
    this.queue.push({ id, element });
    this.listElement.appendChild(element);
    this.updateCurrentSongColor();
  }

  remove(song) {
    const id = `${song.requestedBy}-${song.requestedAt}`;
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return;

    this.listElement.removeChild(this.queue[index].element);
    this.queue.splice(index, 1);
    this.updateCurrentSongColor();
  }

  updateCurrentSongColor() {
    this.queue[0].element.style.backgroundColor = "#363636";
  }

  GetCurrentSong() {
    return this.queue[0];
  }

  get length() {
    return this.queue.length;
  }

  createListItem(item) {
    if (!item) return;

    const li = document.createElement("li");
    li.classList.add("queue-item");
    li.style.animation = "fadeIn 0.5s";

    const thumbnail = document.createElement("img");
    thumbnail.src = item.thumbnail;
    thumbnail.classList.add("thumbnail");
    li.appendChild(thumbnail);

    const details = document.createElement("div");
    details.classList.add("queue-item-details");
    li.appendChild(details);

    const title = document.createElement("span");
    title.innerHTML = `<a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank">${item.title.slice(0, 40)}${
      item.title.length > 40 ? "..." : ""
    }</a>`;
    title.classList.add("title");
    details.appendChild(title);

    const requestedBy = document.createElement("span");
    requestedBy.innerHTML = `Requested by <a href="https://twitch.tv/${item.requestedBy}">${item.requestedBy}</a>`;
    requestedBy.classList.add("requestedBy");
    details.appendChild(requestedBy);

    const skipButton = document.createElement("button");
    skipButton.innerHTML = "🗙";
    skipButton.classList.add("skip-button");
    skipButton.onclick = () => {
      this.websocket.send(JSON.stringify({ type: "REMOVE_SONG", data: item }));
    };
    li.appendChild(skipButton);

    return li;
  }
}
