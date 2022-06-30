import { parentPort, MessagePort, TransferListItem } from 'worker_threads'
import { RequestTransformer } from '../utils/RequestTransformer.js'
import {
  ResponseTransformer,
  ResponseMessage,
} from '../utils/ResponseTransformer.js'
import { FetchQueue } from '../utils/FetchQueue.js'
import { proxyFormData } from '../utils/proxyFormData.js'

const queue = new FetchQueue()

globalThis.addEventListener('load', () => {
  queue.ready()
})

/**
 * Only handle fetch message
 */
parentPort?.addListener('message', async (msg: any) => {
  // Prevent invalid msg
  if (!(msg && typeof msg === 'object')) {
    return
  }
  if (msg.type === 'handle-request') {
    const port2 = msg.payload as MessagePort
    port2.postMessage({ type: 'connected' })
    port2.addListener('message', async (port2Msg) => {
      if (port2Msg.type === 'request') {
        let response = await new Promise<ResponseMessage>(async (resolve) => {
          const request = RequestTransformer.toRequest(port2Msg.payload)
          const fetchEvent = new FetchEvent('fetch', {
            request: proxyFormData(request),
          })
          fetchEvent.respondWith = async (
            r: Response | Promise<Response>
          ): Promise<void> => {
            try {
              const r2 = r instanceof Promise ? await r : r
              const response = ResponseTransformer.toMessage(r2)
              resolve(response)
            } catch (e) {
              resolve(ResponseTransformer.toMessage(new Response('InternalServerError', { status: 500 })))
            }
          }
          queue.push(fetchEvent)
        })

        port2.postMessage({ type: 'response', payload: response }, response.body ? [response.body as unknown as TransferListItem] : [])
      }
    })
  }
})

export { }
