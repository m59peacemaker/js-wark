import { producer } from './producer.js'

export const exposed_producer = () => {
	let produce
	const x = producer(x => produce = x)
	x.produce = produce
	return x
}
