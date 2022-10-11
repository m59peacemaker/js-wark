import { never } from '../Event/never.js';

const of = value => ({ run: () => value, updates: never });

export { of };
