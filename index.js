const Stream = function (initialValue) {

  function stream (value) {
    if (!stream.stale) {
      stream.markStale()
    }

    stream.value = value
    stream.initialized = true
    stream.stale = false

    stream.callDependants()
  }

  const callDependants = () =>
    stream.dependants.forEach(dependant => dependant.dependencyListener(stream))

  Object.assign(stream, {
    value: initialValue,
    initialized: arguments.length !== 0,
    dependants: [],
    dependencies: [],
    stale: false,
    staleDependencies: 0
  })

  const get = () => stream.value

  const set = stream

  const markStale = () => {
    stream.stale = true
    stream.dependants.forEach(dependant => dependant.notifyOfStaleDependency())
  }

  const notifyOfStaleDependency = () => {
    stream.staleDependencies = stream.staleDependencies + 1
    stream.markStale()
  }

  const registerDependant = dependant => stream.dependants.push(dependant)

  return Object.assign(stream, {
    get,
    set,
    callDependants,
    registerDependant,
    markStale,
    notifyOfStaleDependency
  })
}

const combine = combineFn => dependencies => {
  const stream = Stream()
  let changedDependencies = []

  stream.recompute = () => {
    combineFn(dependencies, stream, changedDependencies)
  }

  stream.dependencies = dependencies
  stream.dependenciesInitialized = false

  stream.dependencyListener = dependency => {
    changedDependencies.push(dependency)
    stream.staleDependencies = Math.max(0, stream.staleDependencies - 1)

    if (stream.staleDependencies) {
      stream.callDependants()
      return
    }

    stream.dependenciesInitialized = stream.dependenciesInitialized
      || dependencies.every(dependency => dependency.initialized)

    if (stream.dependenciesInitialized) {
      stream.recompute(dependency)
    }

    stream.stale = false
    changedDependencies = []
  }

  dependencies.forEach(
    dependency => dependency.registerDependant(stream)
  )

  stream.dependencyListener()

  return stream
}

const immediate = stream => {
  if (!stream.dependenciesInitialized) {
    stream.dependenciesInitialized = true
    stream.recompute()
  }
  return stream
}

const map = mappingFn => stream =>
  combine
    (([ stream ], self) => self.set(mappingFn(stream.get())))
    ([ stream ])

const merge = streams => immediate
  (combine
    ((dependencies, self, [ firstChange ]) => {
      if (firstChange) {
        self.set(firstChange.get())
      } else {
        const firstInitializedDependency = dependencies.find(v => v.initialized)
        if (firstInitializedDependency) {
          self.set(firstInitializedDependency.get())
        }
      }
    })
    (streams)
  )

export {
  Stream,
  combine,
  immediate,
  map,
  merge
}
