import decorate from './util/decorate'
import { assertIsStream, assertStreamNotEnded } from './util/asserts'

const withDependencies = ({ dependencies = [], onPropagation }) => stream => {
  let calledSetDuringThisUpdate = null
  let queuedValues = [] // to support multiple calls to `set` within one update

  const setDecorator = set =>
    value => {
      if (calledSetDuringThisUpdate) {
        queuedValues.push(value)
        return
      }

      stream.isPropagator = stream.isPropagator === null ? true : false

      if (!stream.isPropagator) {
        calledSetDuringThisUpdate = true
      }

      return set(value)
    }

  const propagateDecorator = propagate =>
    (...args) => stream.isPropagator
      ? propagate(...args)
      : undefined

  const onPropagationDecorator = onPropagation =>
    dependenciesThatUpdated => {
      assertStreamNotEnded(stream)

      stream.isPropagator = false
      onPropagation(dependenciesThatUpdated)
      return calledSetDuringThisUpdate
    }

  const onPropagationComplete = () => {
    stream.isPropagator = null
    calledSetDuringThisUpdate = null

    const queuedValue = queuedValues.shift()
    if (queuedValue) {
      stream.set(queuedValue)
    }
  }

  const onEndDecorator = onEnd =>
    () => {
      stream.dependencies.forEach(dependency => dependency.unregisterDependant(stream))
      stream.dependencies.clear()
      onEnd()
    }

  const stopDepending = () => {
    stream.dependencies.forEach(dependency => dependency.unregisterDependant(stream))
    stream.dependencies.clear()
  }

  dependencies.forEach(dependency => {
    assertIsStream ('dependency') (dependency)
    dependency.registerDependant(stream)
  })

  return Object.assign(stream, {
    dependencies: new Set(dependencies),
    stopDepending,
    set: decorate (setDecorator) (stream.set),
    isPropagator: null,
    onPropagation: decorate (onPropagationDecorator) (onPropagation),
    onPropagationComplete,
    propagate: decorate (propagateDecorator) (stream.propagate),
    onEnd: decorate (onEndDecorator) (stream.onEnd)
  })
}

export default withDependencies
