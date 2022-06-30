import { IncomingMessage, ServerResponse } from 'http'
import { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { proxyFormData } from './proxyFormData.js'

import { RequestTransformer } from './RequestTransformer.js'

/**
 * Transform and write Web Response headers to node.js ServerResponse
 */
function writeHeaders(res: ServerResponse | Http2ServerResponse, response: Response) {
  if (res instanceof ServerResponse) {
    res.statusCode = response.status
    response.headers.forEach((val, key) => {
      res.setHeader(key, val)
    })
  } else if (res instanceof Http2ServerResponse) {
    const headers: OutgoingHttpHeaders = {
      ':status': response.status ?? 200,
    }
    const forbiddenHeaders = ['connection', 'transfer-encoding', 'keep-alive']
    response.headers.forEach((val, key) => {
      const key1 = key.toLowerCase()
      if (!forbiddenHeaders.includes(key)) {
        headers[key1] = val
      }
    })

    const stream = res.stream
    if (!stream.closed) {
      stream.respond(headers)
    }
  }
}

/**
 * Transform and write Web Response body to node.js ServerResponse
 */
function writeBody(res0: ServerResponse | Http2ServerResponse, response: Response) {
  const { body } = response

  const res = res0 instanceof Http2ServerResponse ? res0.stream : res0
  if (body === null) {
    res.end()
    return
  }

  // TODO maybe working in feature
  // Readable.fromWeb(body).pipe(res)
  let end = false
  let reason = ''
  const reader = body.getReader()
  async function start() {
    while (true) {
      if (end) {
        reader.cancel(reason)
        break
      }
      const chunk = await reader.read()
      if (chunk.done) {
        end = true
        res.end()
        break
      }
      res.write(chunk.value)
    }
  }

  res.once('close', () => {
    reason = 'res close'
    end = true
  })

  start()

}

export async function createFetchEvent(payload: {
  request: IncomingMessage | Http2ServerRequest
  response: ServerResponse | Http2ServerResponse
}) {
  const request = proxyFormData(RequestTransformer.toRequest(payload.request))
  const fetchEvent = new FetchEvent('fetch', {
    request,
  })

  fetchEvent.respondWith = (response: Response) => {
    writeHeaders(payload.response, response)
    writeBody(payload.response, response)
  }

  return fetchEvent
}
