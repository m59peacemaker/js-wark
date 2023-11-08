# Applicative

`Applicative` represents types that can apply a function within the context of the type to a value within the context of the type.

`Applicative` extends [`Functor`](#Functor).

## Methods

### `apply :: Applicative f => f (a -> b) -> f a -> f b`

`apply (f) (x)`

`apply` takes an `Applicative` that contains a function and an `Applicative` that contains a value, and returns a new `Applicative` that contains the result of applying the function to the value.

```js
Applicative.apply (Applicative.of (add (3))) (Applicative.of (2)) // => Applicative.of (5)
```

### `of :: Applicative f => a -> f a`

`of (x)`

`of` takes a value and returns a new `Applicative` that contains that value.

## Laws

### Identity

Applying an applicative of the identity function to an applicative should result in the same applicative.

```
(apply (Applicative.of identity)) = (identity)
```

### Homomorphism

Applying a function wrapped in an applicative to a value wrapped in an applicative is equivalent to applying the function to the value and then wrapping the result in an applicative.

```
(apply (Applicative.of f) (Applicative.of x)) = (Applicative.of (f x))
```
