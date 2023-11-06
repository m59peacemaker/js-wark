import { Occurrences } from '../Occurrences/Occurrences'

export interface Variable<A, B extends A> {
	perform: () => A
	updates: Occurrences<B>
}
