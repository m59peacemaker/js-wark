// request is formed from A and B,
// where A and B can repeatedly send values and at any time
// only once both input values are available,
// the most recent value of each.
	lift ([ A, B ])

// Variation:
// the above, but only when both A and B have changed since this last emitted
// A, B -> C | A, A, A, B -> C | B, B, A -> C
	zip ([ A, B ])

