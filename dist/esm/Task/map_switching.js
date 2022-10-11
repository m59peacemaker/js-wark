import { map } from '../Action/map.js';
import { map_switching as map_switching$1 } from '../Event/map_switching.js';

const map_switching = f => map (map_switching$1 (f));

export { map_switching };
