export const run_post_instant = instant => {
	for (const f of instant.post_propagation) {
		f()
	}
	/*
		TODO: possible implementation of some Task and/or Event function(s) where the Event occurs in the subsequent instant.
		Task.something (value), Action Event where the Event occurs with the given value in the instant after the Action runs
			Event.something (x_event) Event occurs the instant after x_event occurs (Event.afterward?)
		That is possibly implemented as `Event.switching (Event.performing (Task.something))` or `Event.perform_switching (Task.something)` ?
		Then again, maybe some Task function would be implemented from Event.something instead.
	*/
	// if (instant.next.size) {
	// 	run_instant (
	// 		create_instant(),
	// 		instant => {
	// 			for (const f of instant.next) {
	// 				f(instant)
	// 			}
	// 		}
	// 	)
	// }
}
