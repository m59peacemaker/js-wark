##

### Computation Avoidance

aka Demand-Driven Computation

### Simultaneity

### Temporal Determinism

Temporal determinism means that all actions within a system are explicitly associated with and performed within logical instants of time, providing consistent and predictable behavior of operations in relation to time

#### How complicated, inefficient, and error-prone is temporally non-deterministic code?

- How many possible behaviors are indicated by the following five lines of code?
- How easy is it to think through the possibilities and their potential impact on an application at scale?
- How much time does it cost you to think through this?

```js
console.log(Date.now())
console.log(Date.now())
console.log(new Date().toISOString())
console.log(Date.now())
console.log(new Date().toISOString())
```

I humbly admit - I am not positive how many possibe behaviors are expressed by this code, and find it quite hard to consider and calculate. My best guess at a correct answer is "4 infinities". Here are some strategies of counting the possible behaviors. Take my work with a grain of salt!

- Do all the logged values refer to the same millisecond in time? There are 2 possibilities.
- Does each logged value refer to the same millisecond as the former? There are 16 possibilities.
- Is each logged value the same, successive (1ms apart) or any amount further apart? There are 243 possibilities.
- What is the distance between each logged value? There are 4 infinities of possibilities.

The same logic, expressed with semantics of temporal determinism results in a program with only one behavior: it will log 5 values, in two different formats, in the order they are composed, with each value referring to the same millisecond of time. Moreover, this can be performed with at most two-fifths the effort, because there is only need for the implementation to check the current millisecond of time once, and to format it to ISO string once.

```js
// TODO: this can be nicer
;[
	unix_timstamp_ms
	unix_timestamp_ms,
	is8601_datetime,
	unix_timestamp_ms,
	is8601_datetime,
]
	.reduce(
		(acc, x) => Event.chain (log) (Effect.tag (x) (acc)),
		Effect.of(0)
	)
```

## Action

`Action` is an operation performed in an instant of time, that interacts with the real world.

## Effect

`Effect` is an `Action` that impacts the real world, also known as a 'side effect'.

## Sample

`Sample` is an `Action` that examines a property of the real world. A `Sample` does not impact the real world.

## Occurrence

`Occurrence` is a pair of `Instant` and `Value`; a value at an instant in time.

## Timeline

`Timeline` is a sequence of `Occurrence`.

## Event

`Event` is a `Timeline` with a `Dynamic`, `completed`, that indicates the potential for future occurrences of the `Event`.

## Dynamic

`Dynamic` is a `Sample` with an `Event` of its updates. In the instants of its `updates`, its value is updating, and is updated thereafter.
