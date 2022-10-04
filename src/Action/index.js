// TODO: implement the 'next_instant' and/or 'instant_after (event)' concept, presumably by passing around a propagation object instead of just a time value through action.run() calls. Probably something like `propagation.next.add(function_for_next_instant)`.
```js
const instant_after = pipe (
	Event.performing (Action.next_instant), // hmm, need to ponder the possibilies here
	switch
)
```

`Progression.from_array([ 1, 2, 3 ]).run(time0) would update to `1` at `time1`, `2` at time `2`, and `3` at time `3`.
