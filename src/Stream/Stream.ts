import canGetSet from './canGetSet'
import canPropagate from './canPropagate'
import { TYPE_STREAM } from '../constants'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

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
		canPropagate(stream),
		{
			value,
			initialized: arguments.length > 0,
			dependants: new Set(),
			set: stream,
			end,
			[Symbol.toStringTag]: TYPE_STREAM
		}
	)
}

export default Stream
