import { toFormData } from "./multipartParser";

export function proxyFormData(request: Request) {

  return new Proxy(request, {
    get(...args) {
      if (args[1] === 'formData') {
        const [target] = args
        const contentType = target.headers.get('Content-Type')
        if (contentType && /multipart\/form-data/.test(contentType)) {
          return () => {
            return toFormData(target.body, contentType);
          }
        }
        return Reflect.get(...args)
      }
      return Reflect.get(...args)
    }
  })

}