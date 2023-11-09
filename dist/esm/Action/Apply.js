const Apply = construct => f => x =>
	construct (instant =>
		f.perform(instant) (x.perform(instant))
	);

export { Apply };
