const queueDependants = queue => dependency => {
  return dependency.dependants.reduce((queue, dependant) => {
    const queuedDependant = queue.get(dependant)
      || { stream: dependant, changedDependencies: new Set() }
    queue.delete(dependant)
    queuedDependant.changedDependencies.add(dependency)
    queue.set(dependant, queuedDependant)
    return queueDependants (queue) (dependant)
  }, queue)
}

// TODO: implement lifecycle stream.end

const Stream = function (initialValue) {
  const stream = {
    initialized: arguments.length !== 0,
    dependants: []
  }

  let value = initialValue

  const get = () => value

  const set = newValue => {
    value = newValue
    stream.initialized = true
    stream.notifyDependants()
  }

  const registerDependant = dependant => stream.dependants.push(dependant)

  const notifyDependants = () => {
    const queue = queueDependants (new Map()) (stream)
    queue.forEach(
      ({ stream, changedDependencies }) => stream.onDependencyChange([ ...changedDependencies ])
    )
  }


  const toString = () => `stream (${value})`
  const toJSON = () => value

  return Object.assign(stream, {
    get,
    set,
    toString,
    toJSON,
    registerDependant,
    notifyDependants
  })
}

const DependantStream = computeFn => dependencies => {
  const stream = Stream()
  let dependenciesInitialized = false

  // TODO: this is quite ugly
  let shouldNotifyDependants = true
  const notifyDependants = stream.notifyDependants
  stream.notifyDependants = () => {
    if (shouldNotifyDependants) {
      notifyDependants()
    }
  }

  const recompute = (changedDependencies = []) =>
    computeFn(dependencies, stream, changedDependencies)

  const initialize = () => {
    dependenciesInitialized = true
    recompute()
    return stream
  }

  const onDependencyChange = changedDependencies => {
    dependenciesInitialized = dependenciesInitialized
      || dependencies.every(dependency => dependency.initialized)

    if (dependenciesInitialized) {
      shouldNotifyDependants = false
      recompute(changedDependencies)
      shouldNotifyDependants = true
    }
  }

  dependencies.forEach(dependency => dependency.registerDependant(stream))
  onDependencyChange()

  return Object.assign(stream, {
    initialize,
    onDependencyChange
  })
}

const combine = combineFn => dependencies => {
  const stream = DependantStream (combineFn) (dependencies)
  return stream
}

const immediate = stream => stream.initialize()

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
