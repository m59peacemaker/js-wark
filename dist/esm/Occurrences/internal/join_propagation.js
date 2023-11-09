const join_propagation = (f, propagation) => {
	propagation.add(f);
	return () => propagation.delete(f)
};

export { join_propagation };
