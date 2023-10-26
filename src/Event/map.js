import { map as _map } from '../Occurrences/map.js'
import { never } from './never.js'

export const map = f => x => {
	return x.is_complete.perform()
		?
			never
		:
			{
				occurrences: _map (f) (x.occurrences),
				is_complete: x.is_complete
			}
}
