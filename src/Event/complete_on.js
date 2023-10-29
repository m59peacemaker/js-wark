import { of } from '../Variable/of.js'
import { observed } from '../Variable/observed.js'

export const complete_on = complete_event => subject_event => ({
	occurrences: subject_event.occurrences,
	is_complete: complete_event.is_complete.perform()
		?
			of (true)
		:
			observed (complete_event.occurrences)
})
