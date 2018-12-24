const IncrementalIndex = () => {
	let nextIndex = 0
	return {
		next: () => nextIndex++,
		reset: () => nextIndex = 0
	}
}

const create = () => {
	const listeners = new Map()
	const listenerIds = IncrementalIndex()

	function emitter (value) { return emit(value) }

	const emit = (value?) => Array.from(listeners.values()).forEach(listener => listener(value))

	const listen = listener => {
		const listenerId = listenerIds.next()
		listeners.set(listenerId, listener)
		const cancel = () => listeners.delete(listenerId)
		return { cancel }
	}

	const removeAllListeners = () => {
		listeners.clear()
		listenerIds.reset()
	}

	return Object.assign(emitter, {
		emit,
		listen,
		removeAllListeners
	})
}

const of = create

const map = fn => emitter => {
	const mappedEmitter = create()
	emitter.listen(value => mappedEmitter.emit(fn(value)))
	return mappedEmitter
}

const flatten = emitter => {
	const flattenedEmitter = create()
	map
		(value => value.listen(flattenedEmitter.emit))
		(emitter)
	return flattenedEmitter
}

const flatMap = fn => emitter => flatten (map (fn) (emitter))

const chain = flatMap

const filter = predicate => emitter => {
	const filteredEmitter = create()
	map
		(value => {
			if (predicate(value)) {
				filteredEmitter.emit(value)
			}
		})
		(emitter)
	return filteredEmitter
}

const alt = a => b => {
	const emitter = create()
	;[ a, b ].map(e => e.listen(emitter.emit))
	return emitter
}

const combine = emitters => emitters.reduce((acc, emitter) => alt (acc) (emitter))

const fromPromise = promise => {
	const emitter = Emitter()
	promise.then(emitter.emit)
	return emitter
}

const switchTo = emitter => {
	const switchingEmitter = create()
	let listener = { cancel: () => {} }
	map
		(value => {
			listener.cancel()
			listener = value.listen(switchingEmitter.emit)
		})
		(emitter)
	return switchingEmitter
}

const switchMap = fn => emitter => switchTo(map (fn) (emitter))

const constant = v => map (_ => v)

const bufferTo = notifier => source => {
  let bufferedValues = []

  map (v => bufferedValues.push(v)) (source)

  return map
    (() => {
      const values = [ ...bufferedValues ]
      bufferedValues = []
      return values
    })
    (notifier)
}

const bufferN = n => startEvery => source => {
  const maxBufferLength = Math.max(n, startEvery)
  return filter
    (buffer => buffer.length === n)
    (scan
      (v => buffer => {
        buffer = buffer.length === maxBufferLength
          ? buffer.slice(startEvery)
          : buffer
        return buffer.concat([ v ])
      })
      ([])
      (source)
    )
}

const pairwise = bufferN (2) (1)

export {
	alt,
	chain,
	combine,
	constant,
	create,
	filter,
	flatMap,
	flatten,
	fromPromise,
	map,
	switchMap,
	switchTo,
	bufferN,
	bufferTo,
	pairwise,
}
