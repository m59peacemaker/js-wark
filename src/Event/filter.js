import { filter as Occurrences_filter } from '../Occurrences/filter.js'
import { never } from './never.js'

export const filter = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: Occurrences_filter (f) (x.occurrences),
				completed: x.completed
			}
}
