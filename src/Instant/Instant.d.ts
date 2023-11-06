export interface Instant {
	cache:  Map<any>
	post_computations: Set<() => void>
}
