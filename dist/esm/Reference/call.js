import { get } from './get.js';

const _call = (x, f) => get(null, x, f);

const call = f => x => _call (x, f);

export { _call, call };
