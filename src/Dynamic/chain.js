import { hold, map } from './'
import { combineAllByLeftmost, map as Event_map, until, switchDynamic } from '../Event'

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
