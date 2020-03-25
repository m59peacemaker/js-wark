import { constant } from './constant.js'
import { gate } from './gate.js'
import { hold } from '../Dynamic/hold.js'

//export const until = untilEvent => subjectEvent => snapshot (b => e => b ? Final(e) : e) (untilEvent) (subjectEvent)
// switch on a stream that emits final ?
// TODO: termination

export const until = untilEvent => gate(
	hold
		(true)
		(constant (false) (untilEvent))
)
