import canGetSet from './canGetSet'
import canPropagate from './canPropagate'
import Emitter from 'better-emitter'
import { TYPE_STREAM } from '../constants'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

// TODO: can probably ditch the event emitting stuff altogether
// dependant.onSet = () => { dependant.onSet = noop etc }
// call stream.propagate() in set()
function Stream (value) {

	function stream (value) {
		assertStreamNotEnded(stream)
		getterSetter.set(value)
		stream.propagate()
	}

	const getterSetter = canGetSet(stream)

	const end = EndStream()

  return Object.assign(
	  stream,
		getterSetter,
		canPropagate(Emitter(stream)),
		{
			value,
			initialized: arguments.length > 0,
			set: stream,
			end,
			[Symbol.toStringTag]: TYPE_STREAM
	  }
	)
}

export default Stream
