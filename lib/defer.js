import { combine } from './'

const defer = stream => {
  let ignore = stream.initialized
  return combine
    (([ stream ], self) => {
      if (ignore) {
        ignore = false
        return
      }
      self.set(stream.get())
    })
    ([ stream ])
}

export default defer
