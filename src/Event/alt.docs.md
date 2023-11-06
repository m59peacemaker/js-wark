## `Event.alt :: Event a -> Event a -> Event a`

`alt (y) (x)`

"alternatively y, x"

`alt` takes two Events, `y` and `x`, and returns an Event that will occur with the value of `x` if `x` is occurring, and alternatively the value of `y` if `y` is occurring.

`alt` merges the occurrences of two Events, resolving the case that the two events occur simultaneously by choosing the value of the second input event, `x`.

`alt` is a good way to merge two Events when either Event's occurrence value is suitable, or the occurrence value is not important.

#### `y` : `Event a`

The alternative input event, whose occurrence value is used when `a` is not also occurring.

#### `x` : `Event a`

The subject input event, whose occurrence value is used when `x` is occurring, even if `y` is also occurring.

#### `-> Event a`

##### Occurrences
	- the instants of `x`, with the value of `x`.
	- the instants of `y`, with the value of `y` if `x` is not occurring.

##### Completion
	- the instant of `completion (x)`, if `completion (y)` is occurring, or `completed (y)`
	- the instant of `completion (y)`, if `completion (x)` is occurring, or `completed (x)`
