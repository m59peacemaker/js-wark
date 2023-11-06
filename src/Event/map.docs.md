## `Event.map` :: `(a -> b) -> Event a -> Event b`

`map (f) (event)`

`map` takes a unary function and an event, and returns an event with the same occurrences as the input event, but with the occurrence values transformed by the input function.

#### `f` : `(a -> b)`

The input function that transforms the input event's value into the value for the output event.

#### `event` : `Event a`

#### `-> Event b`

##### Occurrences
	- occurrences of `event`, but with the values transformed by the input function.

##### Completion
	- `completion (event)`
