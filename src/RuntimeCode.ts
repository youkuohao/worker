import path from 'path'
import fs from 'fs'
import { findUpSync } from 'find-up'

export class RuntimeCode {
  static __cache = ''
  static __error: any
  static __nodeModules: string | void = ''
  static __polyfillFilename = ''

  static getNodeModules(): string {
    if (RuntimeCode.__error) {
      throw RuntimeCode.__error
    }

    if (!RuntimeCode.__nodeModules) {
      try {
        RuntimeCode.__nodeModules = findUpSync('node_modules', {
          type: 'directory',
        })
        if (!RuntimeCode.__nodeModules) {
          throw new Error('node_modules not found')
        }
      } catch (e: any) {
        RuntimeCode.__error = e
        throw e
      }
    }

    return RuntimeCode.__nodeModules
  }

  static getCodeFilename() {
    return path.resolve(
      RuntimeCode.getNodeModules(),
      `./@youkuohao/worker/lib/worker/index.js`
    )
  }

  static getCode(): string {
    if (RuntimeCode.__error) {
      throw RuntimeCode.__error
    }
    if (!RuntimeCode.__cache) {
      try {
        const runtimeFilename = RuntimeCode.getCodeFilename()
        RuntimeCode.__cache = fs.readFileSync(runtimeFilename, 'utf-8')
      } catch (e: any) {
        RuntimeCode.__error = e
        throw e
      }
    }

    return RuntimeCode.__cache
  }

  static getPolyfillFilename(): string {
    if (RuntimeCode.__error) {
      throw RuntimeCode.__error
    }
    if (!RuntimeCode.__polyfillFilename) {
      try {
        RuntimeCode.__polyfillFilename = path.resolve(
          RuntimeCode.getNodeModules(),
          `./@youkuohao/worker/lib/polyfill/index.js`
        )
      } catch (e: any) {
        RuntimeCode.__error = e
        throw e
      }
    }
    return RuntimeCode.__polyfillFilename
  }
}
