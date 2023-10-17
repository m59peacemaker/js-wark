import { map as _map } from '../Occurrences/map.js'
import { switching as _switching } from '../Occurrences/switching.js'
import { hold } from '../Variable/hold.js'
import { lift2 } from '../Variable/lift2.js'
import { chain } from '../Variable/chain.js'

const and = a => b => a && b

export const switch_updating = resolve => initial_focused_event => source_event => {
	const focused_event = hold (initial_focused_event) (source_event.occurrences)
	const focused_event_is_complete = chain (x => x.is_complete) (focused_event.ocurrences)
	const is_complete = lift2 (and) (focused_event_is_complete) (source_event.is_complete)
	return {
		occurrences: _switch_updating (resolve) (initial_focused_event.occurrences) (source_event.occurrences),
		is_complete
	}
}
