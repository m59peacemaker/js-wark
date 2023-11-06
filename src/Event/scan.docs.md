## `Event.scan :: (a -> b -> b) -> b -> Event a -> Dynamic b`

`scan (reducer) (initial_value) (event)`

`scan` takes a reducer function, an initial value, and an Event, and returns a Dynamic with the initial value and updates when the input event occurs, to the value returned by the reducer called with the input event's value and the output dynamic's current value.

`scan` is akin to a typical fold (also known as reduce), but with a crucial distinction: `fold` returns the final result of the reducer function, whereas `scan` returns a collection of the initial value and each result of the reducer function. Any type that can implement `fold` can also implement `scan`, but the converse is not always true. `Event` can implement `scan`, but not `fold`. `scan` could not possibly take an Event and return the final result of the reducer function, as the inputs to the reducer function are future occurrences of the event. `fold` can transcend the semantics of the input type, while `scan` must preserve the semantics of the input type. This makes `scan` particularly suitable for types like `Event`, which has inescapable temporal qualities. `scan` will take an `Event` and return a `Dynamic`, which is a type capable of representing the initial value and each result of the reducer function across time, as well as carrying the accumulator value across time.

`scan` is the most general way to derive a `Dynamic` from an `Event`.

Fun fact: `hold` can be derived from scan: `scan (x => _ => x)`. However, `scan` can be derived from `hold` via forward reference: `self = hold (initial_value) (snapshot (reducer) (self) (event))`

#### `reducer (event_value => accumulator => result)` : `(a -> b -> b)`

#### `initial_value` : `b`

#### `event` : `Event a`

#### `-> Dynamic b`

##### Value

the initial value, or the most recent result of the reducer function

##### Updates

###### Occurrences
	- instants of the input event, with the value returned by the reducer function

###### Completion
	- completion of the input event
