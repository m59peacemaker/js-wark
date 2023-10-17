import { _map } from '../Occurrences/map.js'
import { never } from './never.js'

export const map = f => x => {
	return x.is_complete.value
		?
			never
		:
			{
				occurrences: _map (f) (x),
				is_complete: x.is_complete
			}
}
