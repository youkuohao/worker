if (!globalThis.CustomEvent) {
  class CustomEvent<T> extends Event {
    detail?: T
    constructor(typeArg: string, eventInitDict?: CustomEventInit<T>) {
      super(typeArg, eventInitDict)
      this.detail = eventInitDict?.detail
    }
  }

  Object.assign(globalThis, {
    CustomEvent,
  })
}

if (!globalThis.ExtendableEvent) {
  class CustomExtendableEvent extends Event implements ExtendableEvent {
    waitUntil(f: any): void {
      return
    }
  }

  globalThis.ExtendableEvent = CustomExtendableEvent
}

if (!globalThis.FetchEvent) {
  class CustomFetchEvent extends ExtendableEvent implements FetchEvent {
    readonly clientId: string
    readonly preloadResponse: Promise<any>
    readonly replacesClientId: string
    readonly request: Request
    readonly resultingClientId: string
    readonly handled: Promise<undefined>

    constructor(type: string, init: FetchEventInit) {
      super(type, init)
      this.request = init.request
      this.clientId = init.clientId || ''
      this.preloadResponse = init.preloadResponse || Promise.resolve(null)
      this.replacesClientId = init.replacesClientId || ''
      this.resultingClientId = init.resultingClientId || ''
      // TODO
      this.handled = Promise.resolve(undefined)
    }

    respondWith(result: Response | Promise<Response>): void {
      return
    }
  }

  Object.assign(globalThis, {
    FetchEvent: CustomFetchEvent,
  })
}

if (!globalThis.addEventListener) {
  const target = new EventTarget()
  globalThis.addEventListener = (...args: any[]): void => {
    target.addEventListener(args[0], args[1], args[2])
  }
  globalThis.dispatchEvent = (event: any): boolean => {
    target.dispatchEvent(event)
    return false
  }
  globalThis.removeEventListener = (...args: any[]): void => {
    target.removeEventListener(args[0], args[1], args[2])
  }
}
