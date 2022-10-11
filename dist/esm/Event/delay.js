import { map } from './map.js';
import { switching } from './switching.js';
import { wait } from './wait.js';
import { pipe2 } from '../util.js';

const delay = ({ ms }) => pipe2(
	map (value => wait ({ ms, value })),
	switching
);

export { delay };
