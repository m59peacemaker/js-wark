## Action

`Action` is an operation performed in an instant of time, that interacts with or impacts the real world.

## Sample

`Sample` is an `Action` that 'samples' a continuous time function or property of the real world, yielding a value that reflects the state of that function or property at a specific instant in time.

`Sample` is semantically equivalent to a "continuous time function", which is sometimes known as "Behavior" or "Property", with a function, "sample", that returns an `Action`.

## Occurrence

`Occurrence` represents a value at an instant in time. It can be thought of as pair of `Instant` and `Value`.

## Occurrences

`Occurrences` are a collection of `Occurrence`. As the temporal aspect of `Occurrence` is meaningful independent of its value, the instants of `Occurrences` may be operated on apart from the values.

## Event

`Event` is `Occurrences` with a `Dynamic`, `completed`, that indicates the potential for future occurrences of the `Event`.

## Dynamic

`Dynamic` is a `Sample` with an `Event` of its updates. In the instants of its `updates`, its value is updating, and is updated thereafter.
