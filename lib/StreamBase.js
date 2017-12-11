import { assertStreamNotEnded } from './util/asserts'
import signalDescendantsAtomically from './util/signal-descendants-atomically'
import { TYPE_STRING } from './constants'

const notifyDependants = stream => {
  let propagationComplete = () => {}

  signalDescendantsAtomically
    ({
      discoverNodes: node => [ ...node.dependants ],
      determineMutualExclusivity: a => b => {
        if (b.endsAbruptly && a === b.end) {
          return a
        }
        if (a.endsAbruptly && b === a.end) {
          return b
        }
        return false
      },
      signal: node => signaledBy => {
        const p = propagationComplete
        propagationComplete = () => {
          p()
          node.onPropagationComplete()
        }
        return node.onPropagation(signaledBy)
      }
    })
    (stream)
  propagationComplete()
}

const StreamBase = ({ initialized, initialValue }) => {
  const stream = function set (value) {
    return stream.set(value)
  }

  const get = () => stream.value

  const set = value => {
    assertStreamNotEnded(stream)
    stream.value = value
    stream.initialized = true
    stream.propagate()
  }

  const propagate = () => {
    return notifyDependants (stream)
  }

  const onEnd = () => {
    stream.dependants.clear()
  }

  const registerDependant = dependant => stream.dependants.add(dependant)
  const unregisterDependant = dependant => stream.dependants.delete(dependant)

  const toString = () => `${TYPE_STRING} (${stream.value})`
  const toJSON = () => value

  return Object.assign(stream, {
    initialized,
    value: initialValue,
    dependants: new Set(),
    registerDependant,
    unregisterDependant,
    get,
    set,
    propagate,
    onEnd,
    toJSON,
    toString,
    [Symbol.toStringTag]: TYPE_STRING,
  })
}

export default StreamBase
