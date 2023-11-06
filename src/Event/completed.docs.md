## `Event.completed :: Event _ -> Dynamic Boolean`

`completed (event)`

`completed` takes an Event and returns a Dynamic that indicates the potential for future occurrences of the input event. While the input event has the possibility of future occurrence, the output dynamic has a value of `false`. The instant the input event no longer has the possibility of future occurrences, the output dynamic updates to `true` and its updates are also completed.

`updates (completed (x))` is equivalent to `completion (x)`.

#### `event` : `Event _`

#### `-> Dynamic Boolean`

##### Value

`false` while the input event may possibly occur.
`true` once the input event no longer has the possibility of occurrence.

##### Updates

###### Occurrences
	- once, with a value of `true` at the instant that the input Event no longer has the possibility of future occurrences.

###### Completion
	- the same as its occurrence
