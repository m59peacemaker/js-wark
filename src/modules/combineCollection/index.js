import { combine, isStream } from '../../'
import { extractCollection } from '../'

const combineCollection = collection =>
  combine
    ((streams, self) => self.set(extractCollection(collection)))
    (Object.values(collection).filter(isStream))

export default combineCollection
