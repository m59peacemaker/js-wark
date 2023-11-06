## `Event.completion :: Event _ -> Event Boolean`

`completion (input_event)`

"the completion of the input event"

`completion` takes an Event and returns an Event that occurs when the input Event is completed.

`completion (x)` is equivalent to `updates (completed (x))`.

#### `input_event` : `Event _`

#### `-> Event Boolean`

##### Occurrences
	- once, with a value of `true` at the instant that the input Event could not have any future occurrences

##### Completion
	- the same as its occurrence
