const registry = new FinalizationRegistry(f => f());

const register_finalizer = (target, value) => {
	const id = {};
	registry.register(target, value);
	return () => registry.unregister(id)
};

export { register_finalizer, registry };
