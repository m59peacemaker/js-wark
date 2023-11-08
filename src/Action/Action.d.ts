import { Monad } from '../typeclass/Monad'
import { Instant } from '../Instant/Instant'

export interface Action<A> extends Monad<A> {
	perform: (instant: Instant): A
}
