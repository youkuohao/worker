export class FetchQueue {
  isReady: boolean
  isDestroyed: boolean
  queue: FetchEvent[]
  constructor() {
    this.isReady = false
    this.isDestroyed = false
    this.queue = []
  }
  push(fetchEvent: FetchEvent): void {
    if (this.isDestroyed) return
    if (this.isReady) {
      globalThis.dispatchEvent(fetchEvent)
    } else {
      this.queue.push(fetchEvent)
    }
  }
  ready(): void {
    this.isReady = true
    while (true) {
      const node = this.queue.shift()
      if (!node) {
        break
      }
      globalThis.dispatchEvent(node)
    }
  }
  destroy(): void {
    this.isDestroyed = true
    this.queue = []
  }
}
