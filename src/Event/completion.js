export const completion = x => ({
	completed: x.completed,
	occurrences: x.completed.updates
})
