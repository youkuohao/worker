import { IncomingMessage, ServerResponse } from "http"
import { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from "http2"
import { Readable } from "stream"
import { ReadableStream } from "stream/web"
import { MessageChannel, TransferListItem, Worker } from "worker_threads"
import { RequestTransformer } from "./RequestTransformer.js"
import { ResponseTransformer } from "./ResponseTransformer.js"

export function handleRequestWithWorker(worker: Worker, req: Http2ServerRequest | IncomingMessage, res: Http2ServerResponse | ServerResponse) {
  const handleRuntimeClose = () => {
    if (res.headersSent) {
      if (res.writable) {
        res.end()
      }
    } else {
      if (res instanceof Http2ServerResponse) {
        res.stream.respond({
          ':status': 503,
          'Retry-After': 3,
        })
      } else {
        res.statusCode = 503
        res.setHeader('Retry-After', 3)
      }
      res.end('Service Unavailable')
    }
  }
  worker.addListener('close', handleRuntimeClose)
  res.addListener('close', () => {
    worker.addListener('close', handleRuntimeClose)
  })

  const { port1, port2 } = new MessageChannel()
  worker.postMessage({ type: 'handle-request', payload: port2 }, [port2])
  port1.addListener('message', (msg) => {
    if (msg.type === 'connected') {
      const request = RequestTransformer.toMessage(req)
      port1.postMessage({ type: 'request', payload: request }, request.body ? [(request.body as unknown as TransferListItem)] : [])
    }
    if (msg.type === 'response') {
      const response = ResponseTransformer.toResponse(
        msg.payload
      )
      if (res instanceof Http2ServerResponse) {
        const headers: OutgoingHttpHeaders = {
          ':status': response.status ?? 200,
        }
        const forbiddenHeaders = [
          'connection',
          'transfer-encoding',
          'keep-alive',
        ]
        response.headers.forEach((val, key) => {
          const key1 = key.toLowerCase()
          if (!forbiddenHeaders.includes(key)) {
            headers[key1] = val
          }
        })

        if (res.writable) {
          res.stream.respond(headers)
          if (response.body instanceof ReadableStream) {
            // this.closeResponseWhenExtensionClose(res)
            Readable.fromWeb(response.body as ReadableStream<any>).pipe(res)
          } else {
            res.end()
          }
        }
      } else {
        const response = ResponseTransformer.toResponse(
          msg.payload
        )
        res.statusCode = response.status ?? 200

        response.headers.forEach((val, key) => {
          res.setHeader(key, val)
        })
        if (response.body) {
          // this.closeResponseWhenExtensionClose(res)
          Readable.fromWeb(response.body as ReadableStream<any>).pipe(res)
        } else {
          res.end()
        }
      }
    }
  })
}