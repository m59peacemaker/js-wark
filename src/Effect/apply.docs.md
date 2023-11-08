## `Action.apply :: Action (a -> b) -> Action a -> Action b`

`apply (function_action) (value_action)`

"apply the function (of an action) to the value (of an action)"

`apply` takes a function-valued Action, `function_action`, and another Action, `value_action`, and returns an Action which has the value resulting from applying the function of `function_action` to the value of `value_action`.

`apply` is semantically equivalent to `f => x => f(x)`, but with `f`, `x`, and the return value wrapped in Action.

#### `function_action` : `Action (a -> b)`

#### `value_action` : `Action a`

#### `-> Action b`
