import { _use } from './use.js';

const use3 = f => a => b => c =>
	_use (a, a =>
		_use (b, b =>
			_use (c, c =>
				f (a) (b) (c)
			)
		)
	);

export { use3 };