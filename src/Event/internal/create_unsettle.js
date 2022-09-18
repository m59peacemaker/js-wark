import { Error_Cycle_Detected } from '../Error_Cycle_Detected.js'

/*
	An Event with a single depedency that is cyclical can't occur in the first place,
	so there's no need to check for a cycle.
*/
export const create_single_dependency_pre_compute = event =>
	dependency => {
		event.propagation = dependency.propagation

		event.settled = false
		for (const observer of event.observers.values()) {
			observer.pre_compute(event)
		}
	}

export const create_multiple_dependency_pre_compute = event => {
	let unsettling = false
	return dependency => {
		event.propagation = dependency.propagation

		if (unsettling) {
			throw new Error_Cycle_Detected()
		}

		if (event.settled) {
			event.settled = false
			unsettling = true
			for (const observer of event.observers.values()) {
				observer.pre_compute(event)
			}
			unsettling = false
		}
	}
}
