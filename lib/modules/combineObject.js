import { combine, isStream } from '../'

const combineObject = object =>
  combine
    ((streams, self) => {
      self.set(
        Object.entries(object).reduce(
          (acc, [ key, value ]) => {
            acc[key] = isStream(value) ? value.get() : value
            return acc
          },
          {}
        )
      )
    })
    (Object.values(object).filter(isStream))

export default combineObject
