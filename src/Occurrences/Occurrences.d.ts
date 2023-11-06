export interface Occurrences<A> {
	compute: Symbol | ((instant: Instant) => false | () => A)
	join_propagation: (f: (instant: Instant) => void) => void
}
