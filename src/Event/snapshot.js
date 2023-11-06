import { snapshot as Occurrences_snapshot } from '../Occurrences/snapshot.js'
import { never } from './never.js'

export const snapshot = f => sample => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: Occurrences_snapshot (f) (sample) (x.occurrences),
				completed: x.completed
			}
}
