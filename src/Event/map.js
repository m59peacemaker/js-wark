import { map as Occurrences_map } from '../Occurrences/map.js'
import { never } from './never.js'

export const map = f => x => {
	return x.is_complete.perform()
		?
			never
		:
			{
				occurrences: Occurrences_map (f) (x.occurrences),
				is_complete: x.is_complete
			}
}
