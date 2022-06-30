/**
 * @deprecated
 */
export function applyBlobArrayBufferPolyfill(): void {
  if (!('arrayBuffer' in Blob.prototype)) {
    Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
      // eslint-disable-next-line
      const blob = this
      return new Promise((resolve) => {
        let arrayBuffer: ArrayBuffer
        const fileReader = new FileReader()
        fileReader.onload = (event): void => {
          arrayBuffer = event.target?.result as ArrayBuffer
          resolve(arrayBuffer)
        }
        fileReader.readAsArrayBuffer(blob)
      })
    }
  }
}

export { }
