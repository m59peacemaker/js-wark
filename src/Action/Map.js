export const Map = construct => f => x =>
	construct (
		instant =>
			f (x.perform(instant))
	)
