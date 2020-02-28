//import * as Emitter from '../Emitter'
import { AtemporalEvent } from '../Event'

export const Time = () => {
	let t = 0

	const startEvent = AtemporalEvent()

	function start () { startEvent.emit() }

	Object.assign(start, startEvent)

	return {
		//start: Emitter.create(),
		start,
		current: () => t,
		forward: () => ++t
	}
}

export const Always = { current: () => Infinity, forward: () => Infinity }
