import { producer } from './producer.js';

const exposed_producer = () => {
	let produce;
	const x = producer(x => produce = x);
	x.produce = produce;
	return x
};

export { exposed_producer };
