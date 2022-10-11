import { nothing } from './internal/nothing.js'
import { produce } from './internal/produce.js'
import { never } from './never.js'
import { catch_up_observer } from './internal/catch_up_observer.js'

export const producer = producer_function => {
	const observers = new Map()

	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			catch_up_observer (self, observer)

			return () => {
				observers.delete(id)
			}
		}
	}

	producer_function (x => produce(self, x))

	return self
}
