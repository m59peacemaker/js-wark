import { nothing } from './internal/nothing.js';
import { noop } from '../util.js';
import { completed } from './completed.js';

const never = {
	computed: null,
	occurred: null,
	complete: completed,
	observe: () => noop,
	settled: true,
	value: nothing
};

export { never };
