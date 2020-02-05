import { combine } from '../../'

const scan = fn => initialValue => source => {
  const newStream = combine
    (([ source ], self) => {
      const newValue = fn
        (self.initialized ? self.get() : initialValue)
        (source.get())
      self.set(newValue)
    })
    ([ source ])

  if (!newStream.initialized) {
    newStream.set(initialValue)
  }

  return newStream
}

export default scan
