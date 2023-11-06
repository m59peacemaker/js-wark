## `Event.create :: () -> Event a`

**`create` is not intended for use in application code or library code.**

`create` creates an Event with `.produce(value)` method to produce occurrences on the Event for **testing or demonstration purposes**.

Calling `event.produce()` creates an instant of time that propagates through compositions on that Event.

**`event.produce` must never be called from within an instant of time.**

##### Occurrences
	- whenever `produce` is called

##### Completion
	- `never`
