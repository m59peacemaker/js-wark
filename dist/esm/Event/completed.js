import { nothing } from './internal/nothing.js';
import { noop } from '../util.js';
import { initial_instant } from '../initial_instant.js';

const completed = (x => {
	x.complete = x;
	return x
})({
	computed: initial_instant,
	occurred: initial_instant,
	observe: () => noop,
	settled: true,
	value: nothing
});

export { completed };
