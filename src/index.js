const keyMaster = require(`key-master`)

const freshMap = () => keyMaster(() => new Map())

const IncrementalIndex () => {
	let nextIndex = 0
	return {
		next: () => nextIndex++,
		reset: () => nextIndex = 0
	}
}

const Emitter = () => {
	const incrementalIndex = IncrementalIndex()
	let eventsMap = freshMap()

	const on = eventName => eventHandler => {
		const id = incrementalIndex.next()
		const listenerMap = eventsMap.get(event)
		listenerMap.set(id, listener)

		const unsubscribe = () => listenerMap.delete(id)

		function eventSubscriber () {
			return unsubscribe()
		}

		return Object.assign(eventSubscriber, { unsubscribe })
	}

	const once = eventName => eventHandler => {
		const eventSubscriber = on
			(eventName)
			(eventValue => {
				eventHandler(eventValue)
				eventSubscriber.unsubscribe()
			})

		return unsubscribe
	}

	const emit = eventName => eventValue => {
		const listeners = eventsMap.get(eventName)
		Array.from(listeners.values()).forEach(listener => listener(eventValue))
	}

	const removeAllListeners = () => {
		eventsMap = freshMap()
		incrementalIndex.reset()
	}

	return {
		on,
		once,
		emit,
		removeAllListeners
	}
}
