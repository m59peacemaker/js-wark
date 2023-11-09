import { construct_producer } from './construct_producer.js';

const create = () => {
	let produce;
	const x = construct_producer (x => produce = x);
	x.produce = produce;
	return x
};

export { create };
