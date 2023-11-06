## `Event.calling :: (a -> b) -> Event a -> Event b`

`calling (f) (input_event)`

"calling the function when the event occurs"

`calling` takes an impure function and an Event, and returns an Event that occurs when the input Event occurs, with the value resulting from calling the impure function with the input Event's value.

`calling` is like `map`, except that `f` is impure. If `f` is a pure function, `map` should be used.

`calling` is similar in nature to a typical emitter "subscribe" method, except that subscribing suggests the low-level and needless concern of unsubscribing, and that `calling` returns an Event composed from the input Event.

#### `f` : `(a -> b)`

The impure function that takes the value of the input event and returns the value for the resulting Event.

#### `input_event` : `Event a`

#### `-> Event b`

##### Occurrences
	- the instants of the input Event, with the value resulting from calling `f` on the value of the input Event

##### Completion
	- `completion (input_event)`
