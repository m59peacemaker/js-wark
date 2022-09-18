export const compute_observers = event => {
	for (const observer of event.observers.values()) {
		observer.compute(event)
	}
}
