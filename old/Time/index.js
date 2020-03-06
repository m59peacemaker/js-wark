import { AtemporalEvent } from '../Event'
import { noop } from '../utils'

export const Time = () => {
	const startEvent = AtemporalEvent()

	function start () { startEvent.emit() }

	Object.assign(start, startEvent)

	let t = 0
	let inAMoment = false
	const pendingMoments = []

	return {
		start,
		current: () => t,
		forward: (fn = noop) => {
			const moment = () => {
				inAMoment = true
				++t
				fn()
				inAMoment = false
				pendingMoments.length && (pendingMoments.shift())()
			}
			inAMoment ? pendingMoments.push(moment) : moment()
		},
	}
}

export const Always = { current: () => Infinity, forward: noop }
