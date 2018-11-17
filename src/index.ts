export { default as Stream } from './Stream'
export { default as combine } from './combine'
export { default as isStream } from './isStream'

const Functor = ({ of, get }) => ({
	get,
	of,
	map: fn => of(fn(get()))
})

const Applicative = ({ of, get }) => Object.assign(
	Functor({ of, get }),
	{ ap: type => type.map(get()) }
)

const Monad = ({ of, get, flatten }) => {
	const applicative = Applicative({ of, get })
	return Object.assign(
		applicative,
		{ chain: fn => flatten(applicative.map(fn)) }
	)
}

const Stream = value => {
	const stream = {
		value,
		initialized: false
	}

	const of = Stream.of
	const flatten = () => Stream.flatten(stream)
	const get = () => stream.value
	const set = value => {
		stream.initialized = true
		stream.value = value
		stream.emit('propagation')
	}

	const end = EndStream()

	// hmph... not sure this belongs here, maybe... the end of something can be dependant on something else, even if the thing itself isn't
	const endsWhen = () => {
		return stream
	}

	return Object.assign(
		stream,
		{
			get,
			set,
			flatten,
			end,
			toJSON: get,
			toString: () => `${stream[Symbol.toStringTag]} (${get()})`,
			[Symbol.toStringTag]: 'Stream'
		},
		Emitter(),
		Monad({ of, get, flatten })
	)
}

const isStream = value => value[Symbol.toStringTag] === 'Stream'

Object.assign(Stream, {
	of: Stream,
	flatten: stream => isStream(stream.get()) ? stream.get() : stream.of(stream.get())
})

const ComputedStream = computation => {
	const stream = Stream()

| let stateDependencies = []
	let timeDependencies = []

	const stateOf = streams => {
		return stream
	}

	const timeOf = streams => {
		return stream
	}

	return Object.assign(
		stream,
		{
			stateOf,
			timeOf
		}
	)
}
