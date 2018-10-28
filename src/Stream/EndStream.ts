import { TYPE_END_STREAM } from '../constants'
import canGet from './canGet'
import canSet from './canSet'
import canPropagate from './canPropagate'
import Emitter from 'better-emitter'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

const EndStream = () => {

	function endStream () {
		assertStreamNotEnded(endStream)
		setter.set(true)
		propagator.propagate()
	}

	const setter = canSet(endStream)
	const propagator = canPropagate(endStream)

	return Object.assign(
		endStream,
		canGet(endStream),
		setter,

		{
			value: false,
			initialized: false,
			set: endStream,
			dependants: new Set(),
			registerDependant: propagator.registerDependant,
			end: endStream,
			[Symbol.toStringTag]: TYPE_END_STREAM
		}
	)
}

export default EndStream
