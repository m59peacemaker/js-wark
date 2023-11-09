import { construct } from './construct.js';

const from = f => construct(() => f());

export { from };
