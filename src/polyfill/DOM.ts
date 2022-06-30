import { JSDOM } from 'jsdom'

if (!globalThis.document) {
  const dom = new JSDOM()
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
  })
}

export { }
