import { combine, isStream } from '../'

const combineCollection = collection =>
  combine
    ((streams, self) => {
      self.set(
        Object.entries(collection).reduce(
          (acc, [ key, value ]) => {
            acc[key] = isStream(value) ? value.get() : value
            return acc
          },
          Array.isArray(collection) ? [] : {}
        )
      )
    })
    (Object.values(collection).filter(isStream))

export default combineCollection
