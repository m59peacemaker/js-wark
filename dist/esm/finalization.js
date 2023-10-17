const registry = new FinalizationRegistry(f => f());

const register_finalizer = registry.register.bind(registry);

export { register_finalizer, registry };
