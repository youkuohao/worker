import { performance } from 'perf_hooks'

if (!globalThis.requestAnimationFrame) {
  let last = 0
  let id = 0
  const queue: any[] = []
  const frameDuration = 1000 / 60

  const raf = function (callback: any): number {
    if (queue.length === 0) {
      const _now = performance.now()
      const next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function () {
        const cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for (let i = 0; i < cp.length; i++) {
          if (!cp[i].cancelled) {
            try {
              cp[i].callback(last)
            } catch (e) {
              setTimeout(function () {
                throw e
              }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false,
    })
    return id
  }

  const caf = function (handle: any): void {
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }

  Object.assign(globalThis, {
    requestAnimationFrame: raf,
    cancelAnimationFrame: caf,
  })
  Object.assign(window, {
    requestAnimationFrame: raf,
    cancelAnimationFrame: caf,
  })
}
