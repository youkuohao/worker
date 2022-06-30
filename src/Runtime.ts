import { Worker, WorkerOptions } from 'worker_threads'
import errors from 'http-errors'
import { Http2ServerRequest, Http2ServerResponse, } from 'http2'
import { IncomingMessage, ServerResponse } from 'http'

import { RuntimeCode } from './RuntimeCode.js'
import {
  RuntimeExtension,
  RuntimeMessage,
  RuntimeMessageExchange,
} from './types.js'
import { handleRequestWithWorker } from './utils/handleRequest.js'

type RuntimeOptions = WorkerOptions & {
  extensions?: RuntimeExtension[]
}

function createWorkerOptions(
  filename: string | URL,
  options: RuntimeOptions = {}
): [string, RuntimeOptions] {
  const useEval = false
  const optionalWorkerData = options.workerData ?? {}

  const registerList = [RuntimeCode.getPolyfillFilename()]
  const optionalExtensions = options.extensions ?? []

  for (const extension of optionalExtensions) {
    if (extension.injectScript) {
      registerList.push(extension.injectScript)
    }
  }

  return [
    useEval ? RuntimeCode.getCode() : RuntimeCode.getCodeFilename(),
    {
      ...options,
      workerData: {
        ...optionalWorkerData,
        filename,
        registerList,
        logsBufferSize: optionalWorkerData.logsBufferSize ?? 1,
      },
      eval: useEval,
    },
  ]
}

export class Runtime extends Worker {
  total: number
  resCache: Map<
    string,
    {
      callback: (
        msg: Partial<RuntimeMessage> & Pick<RuntimeMessage, 'payload'>
      ) => void
      timer: NodeJS.Timeout
    }
  >
  extensions: RuntimeExtension[]

  filename: string | URL

  constructor(filename: string | URL, options: RuntimeOptions) {
    super(...createWorkerOptions(filename, options))

    this.on('message', this.onMessage)
    this.on('online', this.onOnline)
    this.on('messageerror', this.onMessageError)
    this.on('error', this.onError)
    this.on('exit', this.onExit)

    this.filename = filename
    this.extensions = []
    this.resCache = new Map()
    this.total = 0
  }

  get size() {
    return this.resCache.size
  }

  extension = (extension: RuntimeExtension): void => {
    const { name } = extension
    if (!name) {
      throw new Error('Invalid extension')
    }
    const current = this.extensions.find((item) => item.name === name)
    if (!current) {
      this.extensions.push(extension)
    } else {
      throw new Error(`Conflict extension name: ${name}`)
    }
  }

  /**
   * @deprecated will be removed in next version
   * send request message to worker
   * 
   * 根据type找到对应的extension，调用extension的createMessage方法得到可以发送给
   * worker的message和worker处理完message后需要执行的callback（optional）
   * 
   * 发送message之前为这次request创建一个requestId
   * 
   * 如果有callback，将callback存入resCache，等到worker返回数据的时候根据requestId
   * 找到对应的callback并执行
   */
  request = async (data: { type: string; payload: any }): Promise<void> => {
    const extension = this.extensions.find(
      (extension) => extension.name === data.type
    )
    if (!extension || !extension.createMessage) {
      console.log(
        `${new Date().toISOString} no extension found for ${data.type}`
      )
      throw new errors.NotImplemented()
    }
    const result = extension.createMessage(data)
    const { message, transferList = [], timeout = 60000, callback } =
      result instanceof Promise ? await result : result

    message.exchange = RuntimeMessageExchange.request
    message.requestId = `${data.type}-${++this.total}`
    /**
     * 如果没有callback，说明不在乎相应消息，则不用加入resCache
     */
    if (callback) {
      this.resCache.set(message.requestId, {
        callback: (
          msg: Partial<RuntimeMessage> & Pick<RuntimeMessage, 'payload'>
        ) => {
          callback({
            type: message.type,
            requestId: message.requestId,
            exchange: RuntimeMessageExchange.response,
            payload: msg.payload,
          })
        },
        /**
         * 设置超时时间60s
         */
        timer: setTimeout(() => {
          callback({
            type: message.type,
            requestId: message.requestId,
            exchange: RuntimeMessageExchange.response,
            payload: new Error('timeout'),
          })
        }, timeout),
      })
    }

    try {
      this.postMessage(message, transferList)
    } catch (e: any) {
      console.log(`${new Date().toISOString} post message fail ${e.message}`)
      throw new errors.ServiceUnavailable()
    }
  }

  handleRequest(req: Http2ServerRequest | IncomingMessage, res: Http2ServerResponse | ServerResponse) {
    handleRequestWithWorker(this, req, res)
  }

  emitChange = (detail: Record<string, unknown>): void => {
    this.emit('change', {
      detail: {
        ...detail,
      },
    })
  }

  closeAllExtensions = () => {
    for (const ext of this.extensions) {
      ext.dispatchEvent(new Event('close'))
    }
  }

  stop = (): void => {
    this.removeAllListeners()
    this.closeAllExtensions()
    this.terminate().catch((e) => {
      console.error(e)
    })
  }

  /**
   * @deprecated will be removed in next version
   * 响应worker的主动请求，如果是worker的被动请求则不处理
   */
  private response = (msg: RuntimeMessage): void => {
    // 被动请求
    if (msg.exchange === RuntimeMessageExchange.response) {
      return
    }

    const extension = this.extensions.find((item) => item.name === msg.type)
    if (!extension) {
      // Ignore
      return
    }

    if (!extension.handleRequestMessage) {
      return
    }
    extension.handleRequestMessage(msg)
  }

  onMessage = (msg: RuntimeMessage): void => {
    if (msg.exchange === RuntimeMessageExchange.response) {
      const requestId = msg.requestId
      const cache = this.resCache.get(requestId)

      if (!cache || !cache.callback) {
        console.log(
          `${new Date().toISOString()} got untracked response message`
        )
        return
      }

      cache.callback(msg)
      clearTimeout(cache.timer)
      this.resCache.delete(requestId)
    } else {
      this.response(msg)
    }
  }

  onError = (e: Error): void => {
    console.error('worker error', e)
    return
  }

  onExit = (): void => {
    this.removeAllListeners()
    this.emit('exit')
  }

  // TODO worker messageerror event
  onMessageError = (e: Error): void => {
    console.error('worker message error', e)
    return
  }
  // TODO worker online event
  onOnline = (): void => {
    return
  }
}
