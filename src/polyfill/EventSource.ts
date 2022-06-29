import EventSource from 'eventsource'

if (!globalThis.EventSource) {
  Object.assign(globalThis, {
    EventSource,
  })
}
