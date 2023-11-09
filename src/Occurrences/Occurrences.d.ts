export interface Occurrences<A> {
	compute: {} | ((instant: Instant) => false | () => A)
	join_propagation: (f: (instant: Instant) => void) => void
}
