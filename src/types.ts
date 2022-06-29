
export enum RuntimeMessageExchange {
  request,
  response,
}

export type RuntimeMessage = {
  type: string
  exchange: RuntimeMessageExchange
  requestId: string
  payload: any
}

export type ReceiveMessage = (resMsg: RuntimeMessage) => void

export type RuntimeExtension = EventTarget & {
  injectScript?: string
  name: string
  handleRequestMessage?: (msg: RuntimeMessage) => void
  createMessage?: (
    payload: any
  ) =>
    | Promise<{ callback?: ReceiveMessage; timeout?: number; message: any, transferList?: any[] }>
    | { callback?: ReceiveMessage; timeout?: number; message: any, transferList?: any[] }
}


export type EventStreamMessage = {
  data: string | Record<string, any>
  comment?: string
  event?: string
  id?: string
  retry?: number
}


export interface EventStream {
  cancelled: boolean
  readable: ReadableStream
  headers: Record<string, string>
  writeMessage: (message: EventStreamMessage) => void
}
