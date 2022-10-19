import { no_more_occurrences } from './internal/no_more_occurrences.js'

const set_completion_to_self = x => {
	x.completion = x
	return x
}

export const completed = set_completion_to_self({
	occurrences: no_more_occurrences (true)
})
