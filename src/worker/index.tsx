import { parentPort, isMainThread, workerData } from 'worker_threads'

import '../polyfill/Event'

if (isMainThread) {
  throw new Error(`@youkuohao/worker/lib/worker/index.js can only run in worker_threads`)
}

if (!workerData || !workerData.filename) {
  throw new Error(`Invalid workerData`)
}

async function main() {
  try {
    for (const file of workerData.registerList || []) {
      await import(file)
    }

    await import(workerData.filename)
    globalThis.dispatchEvent(new Event('load'))
    console.log('worker started')
  } catch (e: any) {
    console.log(e.stack)
    parentPort?.close()
  }
}

main()
