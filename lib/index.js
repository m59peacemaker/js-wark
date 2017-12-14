import Stream from './Stream'
import combine from './combine'
import immediate from './immediate'
import defer from './defer'
import endsOn from './endsOn'
import endsAbruptly from './endsAbruptly'
import { TYPE_STRING } from './constants'

const isStream = value => value && value[Symbol.toStringTag] === TYPE_STRING

export * from './constants'
export * from './modules'
export {
  Stream,
  isStream,
  combine,
  immediate,
  defer,
  endsOn,
  endsAbruptly
}
