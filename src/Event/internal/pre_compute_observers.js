export const pre_compute_observers = (event, cycle_allowed) => {
	for (const observer of event.observers.values()) {
		observer.pre_compute(event, cycle_allowed)
	}
}
