import { Worker as NodeWorker, WorkerOptions } from 'worker_threads'
import { Http2ServerRequest, Http2ServerResponse, } from 'http2'
import { IncomingMessage, ServerResponse } from 'http'

import { RuntimeCode } from './RuntimeCode.js'
import { handleRequestWithWorker } from './utils/handleRequest.js'

type RuntimeOptions = WorkerOptions & {
  registerList?: string[]
  loader?: string
}

function createWorkerOptions(
  filename: string | URL,
  options: RuntimeOptions = {}
): [string, RuntimeOptions] {
  const useEval = options.eval
  const optionalWorkerData = options.workerData ?? {}
  let loader = options.loader

  const registerList = options.registerList ?? []
  registerList.push(RuntimeCode.getPolyfillFilename())

  if (!loader) {
    loader = useEval ? RuntimeCode.getCode() : RuntimeCode.getCodeFilename()
  }

  return [
    loader,
    {
      ...options,
      workerData: {
        ...optionalWorkerData,
        filename,
        registerList,
      },
    },
  ]
}

export class Worker extends NodeWorker {

  constructor(filename: string | URL, options: RuntimeOptions) {
    super(...createWorkerOptions(filename, options))
  }


  handleRequest(req: Http2ServerRequest | IncomingMessage, res: Http2ServerResponse | ServerResponse) {
    handleRequestWithWorker(this, req, res)
  }

}
