import { filter as Occurrences_filter } from '../Occurrences/filter.js'
import { never } from './never.js'

export const filter = f => x => {
	return x.is_complete.perform()
		?
			never
		:
			{
				occurrences: Occurrences_filter (f) (x.occurrences),
				is_complete: x.is_complete
			}
}
