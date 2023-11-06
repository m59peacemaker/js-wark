## `Event.hold :: a -> Event a -> Dynamic a`

`hold (initial_value) (updates)`

"hold the initial value and then the value of the updates"

`hold` takes a value and an Event, and returns a Dynamic with the input value as its initial value and the input Event as its updates.

Use `hold` when you need an Event's value at a time it is not occurring. The resulting Dynamic will hold the Event's most recent occurrence value in all instants.

#### `initial_value` : `a`

The initial value for the resulting Dynamic.

#### `updates` : `Event a`

The Event that shall be the updates of the output Dynamic.

#### `-> Dynamic a`

Dynamic with the input value as its inital value and the input Event as its updates.

##### Value

The initial value, or the most recent occurrence value of `updates`.

##### Updates

###### Occurrences
	- `updates`

###### Completion
	- `completion (updates)`
