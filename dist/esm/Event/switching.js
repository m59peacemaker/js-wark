import { immediately } from '../immediately.js';
import { never } from './never.js';
import { switch_updating } from './switch_updating.js';

const switching = switch_updating (immediately) (never);

export { switching };
