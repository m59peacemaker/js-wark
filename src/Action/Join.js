export const Join = construct => x =>
	construct (instant => x.perform(instant).perform(instant))
