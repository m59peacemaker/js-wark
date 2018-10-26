import canGetSet from './canGetSet'
import canPropagate from './canPropagate'
import Emitter from 'better-emitter'
import { TYPE_END_STREAM } from '../constants'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

const EndStream = () => {

	function endStream () {
		assertStreamNotEnded(endStream)
		getterSetter.set(true)
		endStream.propagate()
	}

	const getterSetter = canGetSet(endStream)

	return Object.assign(
		endStream,
		getterSetter,
		canPropagate(Emitter(endStream)),
		{
			value: false,
			initialized: false,
			set: endStream,
			end: endStream,
			[Symbol.toStringTag]: TYPE_END_STREAM
		}
	)
}

export default EndStream
