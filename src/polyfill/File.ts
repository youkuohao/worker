
class FilePolyfill extends Blob {
  private _lastModified = 0
  private _name = ''


  constructor(fileBits: any[], fileName: string, options: { lastModified?: number, type?: string } = {}) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`)
    }
    super(fileBits, options)

    if (options === null) options = {}

    // Simulate WebIDL type casting for NaN value in lastModified option.
    const lastModified = options.lastModified === undefined ? Date.now() : Number(options.lastModified)
    if (!Number.isNaN(lastModified)) {
      this._lastModified = lastModified
    }

    this._name = String(fileName)
  }

  get name() {
    return this._name
  }

  get lastModified() {
    return this._lastModified
  }

  get [Symbol.toStringTag]() {
    return 'File'
  }

  //@ts-ignore
  static [Symbol.hasInstance](object) {
    //@ts-ignore
    return !!object && object instanceof Blob && /^(File)$/.test(object[Symbol.toStringTag])
  }
}


if (!globalThis.File) {
  Object.assign(globalThis, { File: FilePolyfill })
}

export { }
