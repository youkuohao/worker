const { Runtime } = require('@youkuohao/worker')
const path = require('path')
const http = require('http')

const runtime = new Runtime(path.resolve(__dirname, './worker.js'))

runtime.start()

http
  .createServer((request, response) => {
    runtime.request({
      type: 'fetch',
      payload: { request, response },
    })
  })
  .listen(8080, () => {
    console.log('Listing on port 8080')
  })
