import { combineAllByLeftmost } from './combineAllByLeftmost.js'
import { switchLatest } from './switchLatest.js'
import { until } from './until.js'

export const switchDynamic = dynamic => {
	const switched = switchLatest (dynamic.update)
	return combineAllByLeftmost ([ switched, until (switched) (dynamic.sample()) ])
}
