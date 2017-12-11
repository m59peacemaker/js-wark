const reduceWhile = predicate => iterateFn => initialValue => array => {
  let value = initialValue
  let i = 0
  while (i < array.length && predicate(value)) {
    value = iterateFn(value, array[i])
    ++i
  }
  return value
}

export default reduceWhile
