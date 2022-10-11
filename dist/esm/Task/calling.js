import { map } from '../Action/map.js';
import { calling as calling$1 } from '../Event/calling.js';

const calling = f => map (calling$1 (f));

export { calling };
