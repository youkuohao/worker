import type { IncomingMessage } from 'http'
import type { Inflate, Gunzip } from 'zlib'
import zlib from 'zlib'
import getRawBody from 'raw-body'
import httpError from 'http-errors'
import type { ParsedMediaType } from 'content-type'

// Read and parse a request body.
export async function readBody(
  req: IncomingMessage,
  typeInfo: ParsedMediaType
): Promise<string> {
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
  const length = encoding === 'identity' ? req.headers['content-length'] : null
  const limit = 100 * 1024 // 100kb
  const stream = decompressed(req, encoding)

  // Read body from stream.
  try {
    return await getRawBody(stream, { encoding: charset, length, limit })
  } catch (rawError: unknown) {
    const error = httpError(
      400,
      /* istanbul ignore next: Thrown by underlying library. */
      rawError instanceof Error ? rawError : String(rawError)
    )

    error.message =
      error.type === 'encoding.unsupported'
        ? `Unsupported charset "${charset.toUpperCase()}".`
        : `Invalid body: ${error.message}.`
    throw error
  }
}

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
