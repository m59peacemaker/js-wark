import { producer } from './producer.js'

export const exposed_producer = () => {
	let produce
	const self = producer(_produce => produce = _produce)
	self.produce = produce
	return self
}
