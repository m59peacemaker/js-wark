import { isStream } from '../../'

const extractCollection = collection => Object
  .entries(collection)
  .reduce(
    (acc, [ key, value ]) => {
      acc[key] = isStream(value) ? value.get() : value
      return acc
    },
    Array.isArray(collection) ? [] : {}
  )

export default extractCollection
