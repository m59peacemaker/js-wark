import { map } from './map.js';
import { switching } from './switching.js';

const map_switching = f => event => switching (map (f) (event));

export { map_switching };
