import { _nothing } from './internal/_nothing.js';
import { noop } from '../util.js';

const never = ({
	instant: () => null,
	compute: () => _nothing,
	propagate: noop,
	dependants: { add: noop, delete: noop }
});

export { never };
