import signalDescendantsAtomically from './signal-descendants-atomically'

const TYPE_STRING = 'WarkStream'

const notifyDependants = signalDescendantsAtomically ({
  getChildren: node => [ ...node.dependants ],
  isSameNode: node => subjectNode => node === subjectNode || node === subjectNode.end,
  signal: node => signaledBy => node.onDependencyChange(signaledBy)
})

const noop = () => {}
const identity = v => v
const True = () => true

/*
  combine() has a concept that end streams need, but don't currently have
  dependant streams might need to notify dependants on set(), if they are the source of the change
  but that call to set() might be stemming from `onDependencyChange`, in which case the set() notifications are handled by the queue outside of the concern of it.
  Maybe the whole queue / notification thing should be reworked so that streams in the graph are more involved instrad of making the top level change responsible for the whole queue thing
  regular streams and end streams are all just streams that can be cross-dependant on one another... and end stream might have regular streams in its dependant tree and vice versa.
  But end streams maybe should have priority when executing the update queue ( see commented out line in signaling function)
    that way, if a stream is going to end in this cycle, it will not be updated during this cycle, unless unavoidable (like a stream that end on its self)
/*
  const a = Stream()
  const b = Stream()
  endsOn(a, b)

 |    a
 |   / \
 |  b b.end

  const a = Stream()
  const b = Stream()
  const c = Stream()
  endsOn(c, b)

 |    a
 |   / \
 |  b   c
 |      |
 |    b.end

  const a = Stream()
  const b = Stream()
  endsOn(b, b)

 |      a
 |     /
 |    b
 |    |
 |  b.end

 */

const createBaseStream = ({
  initialValue,
  initialized = false,
  mapValue = identity,
  shouldNotifyDependants = True,
  afterSet = noop
}) => {
  let value = initialValue

  const stream = {
    [Symbol.toStringTag]: TYPE_STRING,
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

  const registerDependant = dependant =>
    stream.dependants = new Set([ dependant, ...stream.dependants ])
  const unregisterDependant = dependant => stream.dependants.delete(dependant)

  const toString = () => `${TYPE_STRING} (${value})`
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
      onDependencyChange: () => {
        console.log(stream.label, 'end')
        endStream.set(true)
        return true
      }
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

const isStream = value => value[Symbol.toStringTag] === TYPE_STRING

const combine = combineFn => dependencies => {
  let dependenciesInitialized = false
  let shouldNotifyDependants = true

  const recompute = (changedDependencies = []) =>
    combineFn(dependencies, stream, changedDependencies)

  const onDependencyChange = changedDependencies => {
    if (stream.end.get()) {
      return
    }

    dependenciesInitialized = dependenciesInitialized
      || dependencies.every(dependency => dependency.initialized)

    if (dependenciesInitialized) {
      shouldNotifyDependants = false
      recompute(changedDependencies)
      shouldNotifyDependants = true
    }
    // TODO: something besides this. this is quite wretched.
    const calledSet = stream.calledSet
    delete stream.calledSet
    return calledSet
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
        afterSet: () => stream.calledSet = true
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
  isStream,
  combine,
  immediate,
  endsOn,
  TYPE_STRING
}
