
class ResponseMessage {
  /**
   * body is not cloneable after fetch@3, it is a readable-stream
   */
  body: null | ReadableStream
  headers: [string, string][]
  status: number
  statusText: string
  constructor(
    body: ReadableStream<Uint8Array> | null,
    init: { status: number; statusText: string; headers: Headers }
  ) {
    this.status = init.status
    this.statusText = init.statusText

    this.headers = []
    init.headers.forEach((val, key) => {
      this.headers.push([key, val])
    })
    this.body = body


  }
}

class ResponseTransformer {
  static toMessage(res: Response | ResponseMessage): ResponseMessage {
    if (res instanceof Response) {
      return new ResponseMessage(res.body, {
        headers: res.headers,
        status: res.status,
        statusText: res.statusText,
      })
    }
    return res
  }
  static toResponse(res: Response | ResponseMessage): Response {
    if (res instanceof Response) {
      return res
    }

    const headers = new Headers()
    for (const entry of res.headers ?? []) {
      headers.set(entry[0], entry[1])
    }

    return new Response(res.body, {
      headers,
      status: res.status,
      statusText: res.statusText,
    })
  }
}

export { ResponseMessage, ResponseTransformer }
