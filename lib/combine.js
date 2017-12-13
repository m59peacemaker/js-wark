import Stream from './Stream'
import withDependencies from './withDependencies'
import endsOn from './endsOn'

const combine = computeFn => dependencies => {
  let active = false

  const activate = () => {
    if (!active) {
      active = true
      stream.recompute()
    }
  }

  const recompute = (dependenciesThatUpdated = []) =>
    computeFn(dependencies, stream, dependenciesThatUpdated)

  const recomputeIfActive = (...args) => {
    active = active
      ||  [ ...stream.dependencies ].every(dependency => dependency.initialized)

    return active
      ? recompute(...args)
      : undefined
  }

  const stream = withDependencies
    ({ onPropagation: recomputeIfActive, dependencies })
    (Stream())


  const endedDependency = dependencies.find(stream => stream.end.get())

  endsOn (dependencies.map(dependency => dependency.end)) (stream)

  recomputeIfActive()

  // end now if any dependencies are ended
  if (endedDependency) {
    stream.end.set()
  }

  return Object.assign(stream, {
    activate,
    recompute,
    endsAbruptly: false,
    type: 'computed'
  })
}

export default combine
