import { combineAllWith } from './combineAllWith.js'
import { filter } from './filter.js'
import { map } from './map.js'
import { fold } from '../Dynamic/fold.js'
import { compose, adjust, append } from '../util.js'

const allOccurred = buffer => buffer.every(array => array.length > 0)

export const zip = events => {
	const buffer = fold
		(o => acc =>
			Object.entries(o).reduce(
				(acc, [ index, value ]) => adjust (Number(index)) (append(value)) (acc),
				allOccurred(acc) ? acc.map(([ head, ...tail ]) => tail) : acc
			)
		)
		(events.map(() => []))
		(combineAllWith (v => v) (events))

	return compose
		([
			event => Object.assign(event, { buffer }),
			map (buffer => buffer.map(array => array[0])),
			filter (allOccurred)
		])
		(buffer.update)
}
