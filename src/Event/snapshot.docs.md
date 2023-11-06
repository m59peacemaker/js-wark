## `Event.snapshot :: (a -> b -> c) -> Sample a -> Event b -> Event c`

`snapshot (f) (sample) (event)`

`snapshot` takes a function, and Sample, and an Event, and returns an Event that occurs when the input Event occurs, with the value resulting from calling the input function with the input Sample's value at that instant and the input event's occurrence value.

`snapshot` is the most general way to derive an Event's occurrence value from a Sample.

#### `f` : `a -> b -> c`

Function that takes the input sample's value and input event's value, at the instant the input event occurs, and returns the value for the output event's occurrence.

#### `sample` : `Sample a`

#### `event` : `Event b`

#### `-> Event c`

Event that occurs when the input event occurs, with the value returned by the input function.

##### Occurrences
	- instants of the input event, with the value returned by the input function at the instant.

##### Completion
	- the completion of the input event
