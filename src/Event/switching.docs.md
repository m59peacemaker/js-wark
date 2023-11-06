## `Event.switching :: Event Event a -> Event a`

`switching (source_event)`

`switching` takes an Event whose occurrence values are Event, and returns an Event whose occurrences are the occurrences of the Event the input event occurred with most recently.

`switching` is similar in purpose and nature to [Array flat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat), but also must account for the temporal aspect of Event. Multiple events may each have occurrences within the same span of time, meaning that their complete set of values overlap in time. `switching` has a simple, general purpose stategy to account for this: the output event takes occurrences from the event of the input event's occurrence, and ceases taking those occurrences on the next occurrence of the input event. This delineates a non-overlapping start and end for each inner Event, flattening them into the output event sequentially. Consider the array, `[ [ 1, 2 ], [ 3 ] ]`. Flattening this array sequentially extracts values from the first inner array (1, then 2), reaching its end, then moving on to the second inner array, and extracting its value (3). `switching` operates similarly, with the input event marking the transition from one inner Event to the next.

In the case that the input event is occurring, and its occurrence value, the inner event, is also occurring, the output event will occur in that instant with the value of that inner event.

`Event.switching` is a specialization of `Dynamic.switching`. The input event updates a Dynamic Event of Event, which may be called the dynamic 'focused event', and the resulting Event has the occurrences of the focused events. As the dynamic focused event updates, focus is switched to the new focused event. It is possible that the input event (the dynamic focused event's update), the event being focused, as well as the being being unfocused could all be occurring simultaneously. The output event will have the occurrence of the event being focused if it is occurring. The output event will not have the occurrence of the event being unfocused in any case.

#### `source_event` : `Event Event a`

This event may be known as the 'source event', or the 'updates of the dynamic focused event' that `Event.switching` abstracts over.
Its occurrence values are themselves Event, meaning that its occurrence values are 'nested' Events, in the way that the values of `[ [ 1, 2 ], [ 3 ] ]` are nested arrays.

#### `-> event` : `Event a`

##### Occurrences
	- occurrences of the inner (aka 'focused') events.

##### Completion
	- The completion of the source_event, if the focused (or focusing) event is already complete, or is completing.
	- The completion of the focused (or focusing) event, if the source event is already complete, or is completing.
