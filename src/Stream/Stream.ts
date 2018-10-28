import { TYPE_STREAM } from '../constants'
import canGet from './canGet'
import canSet from './canSet'
import canPropagate from './canPropagate'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

function Stream (value) {

	function stream (value) {
		assertStreamNotEnded(stream)
		setter.set(value)
		propagator.propagate()
	}

	const setter = canSet(stream)
	const propagator = canPropagate(stream)

	const end = EndStream()

	return Object.assign(
		stream,
		canGet(stream),
		setter,
		{
			value,
			initialized: arguments.length > 0,
			set: stream,
			dependants: new Set(),
			registerDependant: propagator.registerDependant,
			end,
			[Symbol.toStringTag]: TYPE_STREAM
		}
	)
}

export default Stream
