import { isStream } from '../../'

const isCollection = v => Array.isArray(v)
  || (Object.prototype.toString.call(v) === '[objectObject]')

const extractCollectionDeep = collection => Object
  .entries(collection)
  .reduce(
    (acc, [ key, value ]) => {
      acc[key] = isCollection(value)
        ? extractCollectionDeep(value)
        : isStream(value)
          ? value.get()
          : value
      return acc
    },
    Array.isArray(collection) ? [] : {}
  )

export default extractCollectionDeep
