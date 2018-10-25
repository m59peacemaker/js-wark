const until = predicate => fn => initialValue => {
  let value = initialValue
  while (!predicate (value)) {
    value = fn(value)
  }
  return value
}

export default until
