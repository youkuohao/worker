import { IncomingMessage } from 'http'
import { Http2ServerRequest, IncomingHttpHeaders } from 'http2'

import { toWebStream } from './toWebStream.js'

class RequestMessage {
  url: string
  method: string
  body: null | ReadableStream
  headers: any
  constructor(init: { url: string; method: string; body: ReadableStream | null; headers: any }) {
    this.url = init.url
    this.method = init.method
    this.body = init.body
    this.headers = init.headers

  }
}

class RequestTransformer {
  static toMessage(
    req: Request | IncomingMessage | RequestMessage | Http2ServerRequest
  ): RequestMessage {
    if (req instanceof IncomingMessage) {
      let body = null
      const method = (req.method || 'GET').toUpperCase()
      if (!['GET', 'HEAD'].includes(method)) {
        body = toWebStream(req)
      }

      return new RequestMessage({
        url: `https://${req.headers.host}${req.url}`,
        method,
        body,
        headers: req.headers,
      })
    } else if (req instanceof Request) {
      return new RequestMessage({
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers,
      })
    } else if (req instanceof Http2ServerRequest) {
      const headers: IncomingHttpHeaders = {}
      for (const key in req.headers) {
        if (!key.startsWith(':')) {
          const value = req.headers[key]
          if (typeof value === 'string') {
            headers[key] = value
          }
        }
      }
      let body = null
      const method = (req.headers[':method'] || 'get').toUpperCase()
      if (method && !['GET', 'HEAD'].includes(method)) {
        body = toWebStream(req)
      }

      return new RequestMessage({
        url: `https://${req.headers[':authority']}${req.headers[':path']}`,
        method,
        body,
        headers,
      })
    }


    return req
  }
  static toRequest(
    req: Request | IncomingMessage | RequestMessage | Http2ServerRequest
  ): Request {
    if (req instanceof IncomingMessage) {
      let body = null
      const method = (req.method || 'GET').toUpperCase()
      if (!['GET', 'HEAD'].includes(method)) {
        body = toWebStream(req)
      }
      const headersInit = new Headers({})

      for (const key in req.headers) {
        const value = req.headers[key]
        if (typeof value === 'string') {
          headersInit.append(key, value)
        }
      }

      return new Request(`https://${req.headers.host}${req.url}`, {
        method,
        headers: headersInit,
        body,
      })
    }

    if (req instanceof Http2ServerRequest) {
      const headers: Record<string, string> = {}
      for (const key in req.headers) {
        if (!key.startsWith(':')) {
          const value = req.headers[key]
          if (typeof value === 'string') {
            headers[key] = value
          }
        }
      }
      let body = null
      const method = (req.headers[':method'] || 'get').toUpperCase()
      if (method && !['GET', 'HEAD'].includes(method)) {
        body = toWebStream(req)
      }

      return new Request(
        `https://${req.headers[':authority']}${req.headers[':path']}`,
        {
          method,
          body,
          headers,
        }
      )
    }


    if (req instanceof Request) {
      return req
    }

    return new Request(req.url, {
      method: req.method,
      body: req.body,
      headers: new Headers(req.headers),
    })

  }
}

export { RequestTransformer }
