const completed = x => ({
	perform: x.completed.perform,
	updates: {
		occurrences: x.completed.updates,
		completed: x.completed
	}
});

export { completed };
