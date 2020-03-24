import { combineAllByLeftmost } from './combineAllByLeftmost'
import { switchLatest } from './switchLatest'
import { until } from './until'

export const switchDynamic = dynamic => {
	const switched = switchLatest (dynamic.update)
	return combineAllByLeftmost ([ switched, until (switched) (dynamic.sample()) ])
}
