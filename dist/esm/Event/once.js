import { take_until } from './take_until.js';

const once = x => take_until (x) (x);

export { once };
