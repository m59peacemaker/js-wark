import { never } from '../Occurrences/never.js';

const of = value => ({
	perform: () => value,
	updates: never
});

export { of };
