import { never } from '../Event/never.js';

const of = value => ({
	perform: () => value,
	updates: never
});

export { of };
