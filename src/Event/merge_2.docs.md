## `Event.merge_2` :: `(Occurrence a -> Occurrence b -> Occurrence c) -> Event a -> Event b -> Event c`

`merge_2 (f) (event_x) (event_y)`

TODO: Occurrence should probably be Maybe
TODO: explain more

`merge_2` is the most general way to merge the occurrences of two Events.

#### `f (occurrence_x => occurrence_y => occurrence_z)`: `a -> b -> c`

##### `occurrence_x: a`

##### `occurrence_y: b`

##### `occurrence_z: c`

#### `event_x` : `Event a`

#### `event_y` : `Event b`

#### `-> Event c`

##### Occurrences
	- the instants of `x`, if the input function returns an occurrence value, with that occurence value.
	- the instants of `y`, if the input function returns an occurrence value, with that occurence value.

##### Completion
	- the instant of `completion (event_x)`, if `completion (event_y)` is occurring, or `completed (event_y)`
	- the instant of `completion (event_y)`, if `completion (event_x)` is occurring, or `completed (event_x)`
