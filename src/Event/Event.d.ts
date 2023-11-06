import { Occurrences } from '../Occurrences/Occurrences'
import { Variable } from '../Variable/Variable'

export interface Event<A> {
	occurrences: Occurrences<A>
	completed: Variable<boolean, true>
}
