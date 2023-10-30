export const is_complete = x => ({
	perform: x.is_complete.perform,
	updates: {
		occurrences: x.is_complete.updates,
		is_complete: x.is_complete
	}
})
