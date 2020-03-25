import { hold } from './hold.js'
import { map } from './map.js'
import { combineAllByLeftmost } from '../Event/combineAllByLeftmost.js'
import { map as Event_map } from '../Event/map.js'
import { until } from '../Event/until.js'
import { switchDynamic } from '../Event/switchDynamic.js'

export const chain = f => dynamic => {
	const dynamicOfDynamic = map (v => f(v)) (dynamic)
	return hold
		(dynamicOfDynamic.sample().sample())
		(combineAllByLeftmost ([
			// update when inner dynamic updates
			switchDynamic (map (dynamic => dynamic.update) (dynamicOfDynamic)),
			// update when outer dynamic updates
			Event_map (dynamic => dynamic.sample()) (dynamicOfDynamic.update)
		]))
}
