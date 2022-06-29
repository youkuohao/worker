
export function createDeferredPromise<T>() {
  let resolve: (v: T) => void = () => { }
  let reject: (reason?: any) => void = () => { }
  let promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {
    resolve, reject, promise
  }
}