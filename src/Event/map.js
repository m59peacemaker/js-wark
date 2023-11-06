import { map as Occurrences_map } from '../Occurrences/map.js'
import { never } from './never.js'

export const map = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: Occurrences_map (f) (x.occurrences),
				completed: x.completed
			}
}
