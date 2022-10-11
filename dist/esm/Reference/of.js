import { construct } from './construct.js';

const of = value => construct (assign => assign(value));

export { of };
