import { Worker as NodeWorker, WorkerOptions } from 'worker_threads'
import { Http2ServerRequest, Http2ServerResponse, } from 'http2'
import { IncomingMessage, ServerResponse } from 'http'

import { RuntimeCode } from './RuntimeCode.js'
import { handleRequestWithWorker } from './utils/handleRequest.js'

type RuntimeOptions = WorkerOptions

function createWorkerOptions(
  filename: string | URL,
  options: RuntimeOptions = {}
): [string, RuntimeOptions] {
  const useEval = false
  const optionalWorkerData = options.workerData ?? {}

  const registerList = [RuntimeCode.getPolyfillFilename()]

  return [
    useEval ? RuntimeCode.getCode() : RuntimeCode.getCodeFilename(),
    {
      ...options,
      workerData: {
        ...optionalWorkerData,
        filename,
        registerList,
      },
      eval: useEval,
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
