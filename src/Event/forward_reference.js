
// TODO: make forward_reference(reference => referenced) and then derive this as exposed_forward_reference

// TODO: what are good word(s) for talking about a thing that is referenced? If you have a reference to something, what is that something called? just `referenced` ?

/*
	TODO:
		since the only way to have a cycle is via forward_reference, perhaps forward_reference can take on all the concerns about cycles,
		rather than merge_2_with and switch_with having to deal with them.
		Maybe `assign`, could propagate for the sake of detecting cycles when pre_computing observers.
			Can there be a forward_reference that is not yet assigned, which when assigned will cause a cycle that was therefore not handled here?
		Maybe observers added to the forward_reference could be wrapped with some special logic to handle cycles.
*/

/*
	TODO: maybe add some guards to getters that use `assigned` to throw a helpful error when the forward reference hasn't been assigned
*/
const create_forward_reference_base = (get_complete) => {
	let assigned
	const observers = new Set()
	const unobserves = new Map()
	// const complete_observers = new Set()
	// const complete_unobserves = new Map()
	// const complete_complete_observers = new Set()
	// const complete_complete_unobserves = new Map()

	const self = {
		assign: event => {
			assigned = event
			for (const observer of observers) {
				unobserves.set(observer, event.observe(observer))
			}
			observers.clear()
			if (self.complete !== self) {
				self.complete.assign(event.complete)
			}
			// for (const observer of complete_observers) {
			// 	complete_unobserves.set(observer, event.complete.observe(observer))
			// }
			// for (const observer of complete_complete_observers) {
			// 	complete_complete_unobserves.set(observer, event.complete.complete.observe(observer))
			// }
			// complete_observers.clear()
			// complete_complete_observers.clear()
			return event
		},
		get complete () { return get_complete() },
		get observers () { return assigned.observers },
		get referenced () { return assigned },
		get settled () { return assigned.settled },
		get time () { return assigned.time },
		get value () { return assigned.value },
		observe: observer => {
			if (assigned) {
				return assigned.observe(observer)
			} else {
				observers.add(observer)
				return () => {
					if (assigned) {
						unobserves.get(observer)()
					} else {
						observers.delete(observer)
					}
				}
			}
		}
	}

	return self
}

/*
	NOTE: The depth of complete references is intentionally static, based on the assumption that the complete event of a complete event's complete event is always itself.
	For this implementation of `forward_reference` to be sufficient, it must always be true that `event.complete.complete === event.complete.complete.complete`.
	```js
	Event.complete (Event.completed) === Event.completed
	Event.complete (Event.never) === Event.completed
	Event.complete (Event.interval ({ ms })) === Event.never
	Event.complete (Event.take_until (Event.never) (x)) === Event.never
	Event.complete (take_until (x) (y)) === x
	```
*/
export const forward_reference = () => {

	const reference = create_forward_reference_base(
		() => complete_reference
	)

	const complete_reference = create_forward_reference_base(
		() => complete_complete_reference
	)

	const complete_complete_reference = create_forward_reference_base(
		() => complete_complete_reference
	)

	// reference.assign = event => {
	// 	assigned = event
	// 	for (const observer of observers) {
	// 		unobserves.set(observer, event.observe(observer))
	// 	}
	// 	for (const observer of complete_observers) {
	// 		complete_unobserves.set(observer, event.complete.observe(observer))
	// 	}
	// 	for (const observer of complete_complete_observers) {
	// 		complete_complete_unobserves.set(observer, event.complete.complete.observe(observer))
	// 	}
	// 	observers.clear()
	// 	complete_observers.clear()
	// 	complete_complete_observers.clear()
	// 	return event
	// }

	return reference
}
