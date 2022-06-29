import { IncomingMessage } from 'http'
import type { Inflate, Gunzip } from 'zlib'
import zlib from 'zlib'
import httpError from 'http-errors'
import contentType from 'content-type'
import { Readable } from 'stream'
import { Http2ServerRequest } from 'http2'

// Return a decompressed stream, given an encoding.
function decompressed(
  req: IncomingMessage,
  encoding: string
): IncomingMessage | Inflate | Gunzip {
  switch (encoding) {
    case 'identity':
      return req
    case 'deflate':
      return req.pipe(zlib.createInflate())
    case 'gzip':
      return req.pipe(zlib.createGunzip())
  }
  throw httpError(415, `Unsupported content-encoding "${encoding}".`)
}

export function toWebStream(req: IncomingMessage | Http2ServerRequest) {
  if (req instanceof IncomingMessage) {
    const typeInfo = contentType.parse(req)

    const charset = typeInfo.parameters.charset?.toLowerCase() ?? 'utf-8'

    // Assert charset encoding per JSON RFC 7159 sec 8.1
    if (!charset.startsWith('utf-')) {
      throw httpError(415, `Unsupported charset "${charset.toUpperCase()}".`)
    }

    // Get content-encoding (e.g. gzip)
    const contentEncoding = req.headers['content-encoding']
    const encoding =
      typeof contentEncoding === 'string'
        ? contentEncoding.toLowerCase()
        : 'identity'
    const stream = decompressed(req, encoding)


    return Readable.toWeb(stream)
  } else {
    return Readable.toWeb(req)
  }
}