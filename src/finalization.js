export const registry = new FinalizationRegistry(f => f())

export const register_finalizer = registry.register.bind(registry)
