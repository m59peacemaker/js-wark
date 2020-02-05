# wark

> avoid pain and suffering and fly around on a chocobo or something

![Wark!](https://user-images.githubusercontent.com/4369247/33407500-42f7d608-d537-11e7-9754-1ef262f9d6ad.png)

## THIS STUFF IS NOT RELEVANT TO THIS BRANCH

It's old the library is not like this anymore.

## install

```sh
$ npm install wark
```

## Glossary

### stream

A monadic stream, also known as an "observable", such as those used in functional reactive programming paradigms.


## API

### `Stream (initialValue) -> stream`

Creates and returns a `Stream`.

```js
const stream = Stream ()
```

#### `stream.set (value)`

Sets the value of the stream.

```js
const stream = Stream ()
stream.set (someValue)
```

#### `stream (value)`

Streams are their own `set` function, so they can be invoked directly rather than explicitly calling `stream.set`. This is so that streams may be passed directly as callbacks, or invoked like an action. This is just for the sake of expressive code.

```js
const click$ = Stream ()

addEventListener('click', click$)

// simulate a click
click$(yourOwnClickEventData)

// I find the above more expressive than the following
click$.set(yourOwnClickEventData)

// However, I would always use `stream.set` when the stream does not represent an event or action
const firstName$ = Stream('Jeff')
firstName$.set('Jalf')
```

#### `stream.get() -> currentValue`

Returns the value of the stream.


#### `stream.end`

The stream's `EndStream`, which can be used to end a stream. An ended stream no longer updates or causes updates.

```js
const stream = Stream()

stream.set(5)

stream.get() // => 5

stream.end.get() // => false

stream.end() // or stream.end.set()

stream.end.get() // true

stream.set(10)

stream.get() // => 5
```


#### `stream.initialized`

An ininitialized stream is a stream that has a value.

A stream is initialized if it is created with an initial value or once it has had its `set` called.


#### `stream.active`

A stream is active once all its dependencies are initialized or it has been activated manually with `activate(stream)`. An active stream recomputes when any of its dependencies are set.

This is different from `initialized` in that an active stream may not have called `set` when recomputing due to dependencies being set.


### `combine (computeFn) (dependencies) -> stream`

`combine` is the low level function for combining streams. It should only be used to create higher level combinators.

By default, the combined stream will only call its `computeFn` when all of its dependencies have initialized.

A stream can be initialized without waiting on dependencies with `initialize(stream)`.


#### `computeFn (self, dependencies, updatedDependencies)`

`computeFn` receives a reference to the new stream `self`, its dependencies, and an array of its dependencies that changed.

`computeFn` does not need to return a value.

Call `self.set` in `computeFn` to set the combined stream's value.

`self.set` should generally only be called once within `computeFn`, as it is meant to compute and set the value the stream should have according to the current state of its dependencies. To call `self.set` `n` times expresses a mapping of 1 dependency state to `n` dependency states. This can be handled by either ignoring mutiple calls, either using the first or last of them, or allowing multiple states. `wark` chooses the latter as it is the least surprising / magical. Either calling `self.set` multiple times or setting a dependency from within `computeFn` will result in the final state, but will have intentionally caused an intermediate update. Do this only with extreme caution.
TODO: better define and thoroughly explain how the update works in this case.


```js
const streamA = Stream(10)
const streamB = Stream()

const streamAB = combine
  ((self, [ a, b ], updatedDependencies) => self.set (a.get() + b.get()))
  ([ streamA, streamB ])

streamAB.get() // => undefined (dependencies not intialized)

streamB.set(5)

streamAB.get() // => 15
```

### `isStream(value) -> boolean`

### `activate(stream)`

Manually sets a stream to `active` so that it will be recomputed when any of its dependencies are set, even though not all of its dependencies are initialized.
