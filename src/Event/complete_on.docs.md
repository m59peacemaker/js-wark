## `Event.complete_on :: Event _ -> Event a -> Event a`

`complete_on (complete_event) (subject_event)`

"complete on the complete event, the subject_event"

#### `complete_event` : `Event _`

The Event whose next occurrence shall be the completion Event of the output Event.

#### `subject_event` : `Event a`

The Event whose occurrences shall be the occurrences of the output Event.

#### `-> Event a`

##### Occurrences
	- `subject_event`

##### Completion
	- `complete_event`
