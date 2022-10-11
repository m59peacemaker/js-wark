import { _use } from '../Reference/use.js';

const updates = dynamic =>
	_use(dynamic, dynamic => dynamic.updates);

export { updates };
