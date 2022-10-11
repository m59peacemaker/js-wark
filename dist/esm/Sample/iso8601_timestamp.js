import { map } from './map.js';
import { unix_timestamp } from './unix_timestamp.js';

const iso8601_timestamp = map (x => new Date(x).toISOString()) (unix_timestamp);

export { iso8601_timestamp };
