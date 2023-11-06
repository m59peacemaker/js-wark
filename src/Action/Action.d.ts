import { Action } from '../Action/Action'
import { Instant } from '../Instant/Instant'

export interface Action<A> {
	perform: (instant: Instant): A
}
