import { construct_on_demand_producer } from './construct_on_demand_producer.js'

export const dom_event = name => target =>
	construct_on_demand_producer (
		produce => {
			target.addEventListener(name, produce)
			return () => target.removeEventListener(name, produce)
		}
	)
