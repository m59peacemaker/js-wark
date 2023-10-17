import { weak_producer } from './weak_producer.js';

// import { once } from './once.js'

const wait = ({ ms }) =>
	// TODO: once
	// once (
		weak_producer (produce => {
			const timeout = setTimeout (() => produce (ms), ms);
			timeout.unref && timeout.unref();
			return () => clearTimeout (timeout)
		});
	// )

export { wait };
