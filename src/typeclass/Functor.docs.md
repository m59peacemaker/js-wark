# Functor

`Functor` represents types that can be mapped over.

## Methods

### `map :: Functor f => (a -> b) -> f a -> f b`

`map (f) (x)`

`map` transforms the value of a `Functor`.

`map` takes a transformation function `(a -> b)` and a `Functor` of `a` (`f a`), and returns a `Functor` of `b` (`f b`).

```js
map (add (3)) (Functor.of (2)) // => Functor.of (5)
```

## Laws

Instances of `Functor` must satisfy two laws:

### Identity

Mapping the identity function over a functor should result in the same functor as the original functor.

```
(map identity) = (identity)
```

### Composition

Mapping a composition of two functions over a functor should result in the same functor as mapping the first function over the functor and then mapping the second function over the result.

```
(map (compose f g)) = (compose (map f) (map g))
```
