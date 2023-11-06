## `Event.tag :: Sample a -> Event _ -> Event a`

`tag (sample) (event)`

"tag with the sample, the event"

`tag` takes a Sample and an Event and returns an Event that occurs with the value of the Sample in the instance of the occurrence.

`tag` is a specialization of `snapshot`.

#### `sample` : `Sample a`

#### `event` : `Event _`

#### `-> Event a`

##### Occurrences
	- occurrences of `event`, but with the value of `sample` at the instant of occurrence.

##### Completion
	- `completion (event)`
