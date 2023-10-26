import { filter as _filter } from '../Occurrences/filter.js'
import { never } from './never.js'

export const filter = f => x => {
	return x.is_complete.perform()
		?
			never
		:
			{
				occurrences: _filter (f) (x.occurrences),
				is_complete: x.is_complete
			}
}
