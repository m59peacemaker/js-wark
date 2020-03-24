import { constant } from './constant'
import { gate } from './gate'
import { hold } from '../Dynamic'

//export const until = untilEvent => subjectEvent => snapshot (b => e => b ? Final(e) : e) (untilEvent) (subjectEvent)
// switch on a stream that emits final ?
// TODO: termination

export const until = untilEvent => gate(
	hold
		(true)
		(constant (false) (untilEvent))
)
