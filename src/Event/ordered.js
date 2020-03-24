import { combineAllWith } from './combineAllWith'
import { map } from './map'
import { zip } from './zip'

export const ordered = events => combineAllWith
	(o => Object.values(o).map(values => values[values.length - 1]))
	(events.map((event, index) => index === 0 ? map (Array.of) (event) : zip(events.slice(0, index + 1))))
