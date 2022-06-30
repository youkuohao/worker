import { EventStream, EventStreamMessage } from "../types.js";


export class ServerEventStream implements EventStream {
  constructor() {
    this.headers = {
      'Content-Type': 'text/event-stream',
      'Transfer-Encoding': 'identity',
      'Cache-Control': 'no-cache',
    }
    this.cancelled = false
    this.cache = []
    this.readable = new ReadableStream({
      start: (controller) => {
        const push = () => {
          if (this.cache.length > 0) {
            controller.enqueue(this.cache.shift());
            push()
          } else {
            new Promise((resolve, reject) => {
              this.promise = { resolve, reject }
            }).then(msg => {
              controller.enqueue(msg);
              push()
            }).catch(e => {
              this.cancel(e)
            })
          }
        }
        push()
      },
      pull: () => {
        // console.log('pull')
      },
      cancel: (reason) => {
        // console.log('ServerEventStream cancelled', reason)
        this.cancelled = true
      }
    })
  }

  headers: Record<string, string>
  readable: ReadableStream
  cancelled: boolean
  cache: string[]
  promise?: {
    resolve: (msg: string) => void
    reject: (reason: any) => void
  }

  cancel = (reason?: any) => {
    this.readable.cancel(reason)
  }

  writeMessage = (message: EventStreamMessage) => {
    let msg = ''
    if (message.comment) msg += `: ${message.comment}\n`
    if (message.event) msg += `event: ${message.event}\n`
    if (message.id) msg += `id: ${message.id}\n`
    if (message.retry) msg += `retry: ${message.retry}\n`
    if (message.data) msg += this.stringifyMessage(message.data)
    msg += '\n'
    if (this.promise) {
      this.promise.resolve(msg)
      delete this.promise
    } else {
      this.cache.push(msg)
    }
  }

  stringifyMessage = (data: string | Record<string, any>): string => {
    if (typeof data === 'object') return this.stringifyMessage(JSON.stringify(data))
    return data
      .split(/\r\n|\r|\n/)
      .map((line) => `data: ${line}\n`)
      .join('')
  }
}