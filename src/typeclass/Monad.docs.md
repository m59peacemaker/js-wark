# Monad

`Monad` represents types that can form and join a structure of instances together within the context of an instance.

`Monad` extends [`Applicative`](#Applicative).

## Methods

### `chain :: Monad m => (a -> m b) -> m a -> m b`

`chain (f) (x)`

The `chain` method takes a function and a `Monad` that contains a value, and returns a new `Monad` that contains the result of applying the function to the value.

`chain` both forms and joins together the structure of instances.

`chain` is a composition of `map (f) (x)` and `join` - `map (f) (x)` forms the structure, and `join` connects it.

### `join :: Monad m => m (m a) -> m a`

`join (x)`

The `join` method takes a `Monad` (the outer Monad) that contains a `Monad` (the inner Monad) as its value, and returns a new `Monad` that contains the inner Monad's value.

## Laws

### Left Identity

A monad of `x` chained with a `function` has the same result as applying the `function` to `x`.

`
(chain f (Monad.of x)) = (f x)
`

### Right Identity

A monad chained with `of` is the same as the original monad.

```
(chain Monad.of m) = m
```

### Associativity

Chaining operations on monads must be associative - the order of nested monadic computations must not affect the final result.

```
(chain (f => chain g f) m) = (chain g (chain f m))
```
