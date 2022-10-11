import { construct } from './construct.js';

const from_function = f => construct(() => f());

export { from_function };
