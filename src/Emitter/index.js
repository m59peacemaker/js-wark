import { noop, identity } from '../utils'

const IncrementalIndex = () => {
	let nextIndex = 0
	return {
		next: () => nextIndex++,
		reset: () => nextIndex = 0
	}
}

const create = () => {
	const subscribers = new Map()
	const subscriberIds = IncrementalIndex()

	function emitter (value) { return emit(value) }

	const emit = value => Array.from(subscribers.values()).forEach(subscriber => subscriber(value))

	const subscribe = subscriber => {
		const subscriberId = subscriberIds.next()
		subscribers.set(subscriberId, subscriber)
		return () => subscribers.delete(subscriberId)
	}

	const unsubscribeAll = () => {
		subscribers.clear()
		subscriberIds.reset()
	}

	return Object.assign(emitter, {
		emit,
		subscribe,
		unsubscribeAll
	})
}

const of = create

const map = fn => emitter => {
	const mappedEmitter = create()
	emitter.subscribe(value => mappedEmitter.emit(fn(value)))
	return mappedEmitter
}

const from = map (identity)

const scan = reducer => initialValue => emitter => {
	let acc = initialValue
	return map
		(value => {
			acc = reducer (value) (acc)
			return acc
		})
		(emitter)
}

const flatten = emitter => {
	const flattenedEmitter = create()
	map
		(value => value.subscribe(flattenedEmitter.emit))
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
	;[ a, b ].map(e => e.subscribe(emitter.emit))
	return emitter
}

const combine = emitters => emitters.reduce(
	(acc, emitter) => alt (acc) (emitter),
	create()
)

const fromPromise = promise => {
	const emitter = create()
	promise.then(emitter.emit)
	return emitter
}

const switchTo = emitter => {
	const switchingEmitter = create()
	let unsubscribe = noop
	map
		(value => {
			unsubscribe()
			unsubscribe = value.subscribe(switchingEmitter.emit)
		})
		(emitter)
	return switchingEmitter
}

const switchMap = fn => emitter => switchTo(map (fn) (emitter))

const constant = v => map (_ => v)

const recentN = n => scan
	(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
	([])

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
			(v => buffer => [ ...(buffer.length === maxBufferLength ? buffer.slice(startEvery) : buffer), v ])
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
	from,
	fromPromise,
	map,
	recentN,
	scan,
	switchMap,
	switchTo,
	bufferN,
	bufferTo,
	pairwise
}
