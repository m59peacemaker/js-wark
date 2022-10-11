import { construct } from './construct.js';

const chain = f => s =>
	construct (instant => f (s.run (instant)).run (instant));

export { chain };
