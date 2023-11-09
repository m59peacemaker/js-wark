import { hold } from '../Event/hold.js';
import { create as create$1 } from '../Event/create.js';

const create = initial_value => hold (initial_value) (create$1());

export { create };
