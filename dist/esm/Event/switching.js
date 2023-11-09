import { hold } from './hold.js';
import { switching as switching$1 } from '../Dynamic/switching.js';
import { never } from './never.js';

const switching = event => switching$1 (hold (never) (event));

export { switching };
