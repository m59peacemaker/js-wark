## `Sample.wait :: Number -> Sample Event Number`

`wait ({ ms })`

`wait` takes a number of milliseconds and returns a Sample of an Event that has an occurrence at least the input number of milliseconds after the current millisecond of time.

#### `ms` : `Number`

The minimum number of milliseconds between now and the Event's occurrence.

To understand why `ms` is a minimum number of milliseconds rather than the exact number of milliseconds, [read this](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#reasons_for_delays_longer_than_specified).

#### `-> Sample Event`

##### Occurrences
	- once, at least the given number of milliseconds into the future.

##### Completion
	- the same as its occurrence
