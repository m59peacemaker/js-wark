import Emitter from 'better-emitter'
import { TYPE_STREAM } from '../constants'
import canGet from './canGet'
import canSet from './canSet'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

function Stream (value) {

	function stream (value) {
		assertStreamNotEnded(stream)
		setter.set(value)
		stream.emit('propagation')
	}

	const setter = canSet(stream)

	const end = EndStream()

	return Object.assign(
		stream,
		canGet(stream),
		setter,
		Emitter(),
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
