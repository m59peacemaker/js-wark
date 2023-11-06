## `Event.filter :: (a => boolean) -> Event a -> Event a`

`filter (predicate) (subject_event)`

"filter by the predicate, the subject event"

`filter` takes a predicate function and an Event and returns an Event that only includes the occurrences of the input Event for which the predicate function applied to the occurrence value returns `true`.

`filter` excludes occurrences of the input Event whose values do not satisfy the predicate function.

#### `predicate` : `(a => boolean)`

#### `subject_event` : `(a => boolean)`

#### `-> Event a`

##### Occurrences
	- occurrences of `subject_event`, excluding those in which the subject event's value does not pass the predicate function.

##### Completion
	- `completion (subject_event)`
