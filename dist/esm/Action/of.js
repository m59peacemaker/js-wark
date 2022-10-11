import { construct } from './construct.js';

const of = x => construct (() => x);

export { of };
