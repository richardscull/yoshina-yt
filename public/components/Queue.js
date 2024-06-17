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
    const element = this.createListItem(song.title);
    const id = `${song.requestedBy}-${song.requestedAt}`;
    this.queue.push({ id, element });
    this.listElement.appendChild(element);
  }

  remove(song) {
    const id = `${song.requestedBy}-${song.requestedAt}`;
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return;

    this.listElement.removeChild(this.queue[index].element);
    this.queue.splice(index, 1);
  }

  GetCurrentSong() {
    return this.queue[0];
  }

  get length() {
    return this.queue.length;
  }

  createListItem(item) {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }
}
