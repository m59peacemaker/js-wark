import { of } from '../Variable/of.js'
import { observed } from '../Variable/observed.js'

export const complete_on = complete_event => subject_event => ({
	occurrences: subject_event.occurrences,
	completed: complete_event.completed.perform()
		?
			of (true)
		:
			observed (complete_event.occurrences)
})
