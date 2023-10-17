import { hold } from '../Event/hold.js';
import { exposed_producer } from '../Event/exposed_producer.js';

const create = initial_value => hold (initial_value) (exposed_producer());

export { create };
