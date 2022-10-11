import { immediately } from '../immediately.js';
import { switch_updating } from '../Event/switch_updating.js';
import { updates } from './updates.js';
import { get } from './get.js';

// TODO: THIS IS WRONG! Using `get` here will needlessly cause the dynamic and its upstream dynamics to recompute (or worse, upstream plain samples, if that's a thing somehow)
const switching = dynamic => switch_updating (immediately) (get (dynamic)) (updates (dynamic));

export { switching };
