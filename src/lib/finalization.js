export const registry = new FinalizationRegistry(f => f())

export const register_finalizer = (target, value) => {
	const id = {}
	registry.register(target, value)
	return () => registry.unregister(id)
}
