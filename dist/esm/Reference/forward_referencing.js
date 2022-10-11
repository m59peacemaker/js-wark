import { construct } from './construct.js';

const forward_referencing = f =>
	construct((assign, reference) => assign(f(reference)));

export { forward_referencing };
