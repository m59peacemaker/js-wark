export const Chain = construct => f => x =>
	construct (instant => f (x.perform(instant)).perform(instant))
