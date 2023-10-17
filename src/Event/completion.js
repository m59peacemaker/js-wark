export const completion = x => ({
	occurrences: x.is_complete.updates,
	is_complete: x.is_complete
})
