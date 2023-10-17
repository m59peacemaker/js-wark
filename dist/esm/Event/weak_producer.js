import { create } from '../Instant/create.js';
import { register_finalizer } from '../finalization.js';

const weak_producer = f => {
	let instant = null;

	const self = {
		instant: () => instant,
		dependants: new Set()
	};

	const self_ref = new WeakRef(self);

	register_finalizer(
		self,
		// TODO: extract and share 'produce' logic among producers
		f(x => {
			const self = self_ref.deref();
			instant = create();
			instant.cache.set(self, {
				computed: true,
				value: x
			});
			for (const dependant of self.dependants) {
				dependant.propagate(instant);
			}
			for (const f of instant.computations) {
				f(instant);
			}
			for (const f of instant.post_computations) {
				f(instant);
			}
			instant = null;
		})
	);

	return self
};

export { weak_producer };
