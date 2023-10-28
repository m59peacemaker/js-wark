import { snapshot as Occurrences_snapshot } from '../Occurrences/snapshot.js'
import { never } from './never.js'

export const snapshot = f => sample => x => {
	return x.is_complete.perform()
		?
			never
		:
			{
				occurrences: Occurrences_snapshot (f) (sample) (x.occurrences),
				is_complete: x.is_complete
			}
}
