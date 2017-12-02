const noop = () => {}
const identity = v => v
const True = () => true

const queueDependants = queue => dependency => {
  return [ ...dependency.dependants ].reduce((queue, dependant) => {
    const queuedDependant = queue.get(dependant)
      || { stream: dependant, changedDependencies: new Set() }
    queue.delete(dependant)
    queuedDependant.changedDependencies.add(dependency)
    queue.set(dependant, queuedDependant)
    return queueDependants (queue) (dependant)
  }, queue)
}

const notifyDependants = dependency => {
  const queue = queueDependants (new Map()) (dependency)
  queue.forEach(
    ({ stream, changedDependencies }) => stream.onDependencyChange([ ...changedDependencies ])
  )
}

const createBaseStream = ({
  initialValue,
  initialized = false,
  mapValue = identity,
  shouldNotifyDependants = True,
  afterSet = noop
}) => {
  let value = initialValue

  const stream = {
    initialized,
    dependants: new Set()
  }

  const get = () => value

  const set = newValue => {
    value = mapValue(newValue)
    // a stream is always initialized once its set function has been called
    stream.initialized = true
    if (shouldNotifyDependants()) {
      notifyDependants(stream)
    }
    afterSet()
  }

  const registerDependant = dependant => stream.dependants.add(dependant)
  const unregisterDependant = dependant => stream.dependants.delete(dependant)

  const toString = () => `stream (${value})`
  const toJSON = () => value

  return Object.assign(stream, {
    get,
    set,
    registerDependant,
    unregisterDependant,
    toString,
    toJSON
  })
}

const withDependencies = ({ dependencies = [], onDependencyChange }) => stream => {
  dependencies.forEach(dependency => dependency.registerDependant(stream))

  const stopDepending = () => {
    stream.dependencies.forEach(dependency => dependency.unregisterDependant(stream))
    stream.dependencies.clear()
  }

  return Object.assign(stream, {
    dependencies: new Set(dependencies),
    onDependencyChange,
    stopDepending
  })
}

const withEndStream = stream => {
  const end = () => {
    ;[ stream, stream.end ].forEach(stream => {
      stream.dependants.clear()

      if (stream.dependencies) {
        stream.stopDepending()
      }
    })
  }
  const endStream = createBaseStream ({
    initialValue: false,
    initialized: false,
    mapValue: True,
    afterSet: end
  })

  // end streams are their own end streams
  endStream.end = endStream

  stream.end = endStream

  const endDependencies = stream.dependencies
    ? [ ...stream.dependencies ].map(dependency => dependency.end)
    : []

  withDependencies
    ({
      dependencies: endDependencies,
      onDependencyChange: () => endStream.set(true)
    })
    (endStream)

  return stream
}

const Stream = initialValue => withEndStream
  (createBaseStream ({
    initialValue,
    initialized: initialValue !== undefined
  }))

/* when stream.end.set() is called, end the stream
  stream.end is registered to the end stream of each dependency by default, so if any of those end streams emit, the stream will also end
"end" means that:
  as with any stream set, it will notify dependants
    anything dependant on `stream` that wants to end with it should have
      `stream.end.registerDependant(thatStream.end)`
  and all of these will occur for the stream and its stream.end:
    it will be unregistered from its dependencies, so they will not notify it of need to update
    its dependencies will be cleared
    its dependants will be cleared
*/

const combine = combineFn => dependencies => {
  let dependenciesInitialized = false
  let shouldNotifyDependants = true

  const recompute = (changedDependencies = []) =>
    combineFn(dependencies, stream, changedDependencies)

  const onDependencyChange = changedDependencies => {
    dependenciesInitialized = dependenciesInitialized
      || dependencies.every(dependency => dependency.initialized)

    if (dependenciesInitialized) {
      shouldNotifyDependants = false
      recompute(changedDependencies)
      shouldNotifyDependants = true
    }
  }

  const initialize = () => {
    dependenciesInitialized = true
    recompute()
    return stream
  }

  const stream = withEndStream
    (withDependencies
      ({
        dependencies,
        onDependencyChange
      })
      (createBaseStream({
        shouldNotifyDependants: () => shouldNotifyDependants,
      }))
    )

  onDependencyChange()

  return Object.assign(stream, {
    initialize,
    recompute
  })
}

const immediate = stream => stream.initialize()

const endsOn = streamToEndOn => streamToEnd => {
  streamToEnd.end.stopDepending()
  streamToEnd.end.dependencies.add(streamToEndOn)
  streamToEndOn.registerDependant(streamToEnd.end)
  return streamToEnd
}

export {
  Stream,
  combine,
  immediate,
  endsOn
}
