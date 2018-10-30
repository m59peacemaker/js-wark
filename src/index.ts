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
	const stream = { value }
	const of = Stream.of
	const flatten = () => Stream.flatten(stream)
	const get = () => stream.value
	const set = value => stream.value = value

	return Object.assign(
		stream,
		{
			get,
			set,
			flatten,
			toJSON: get,
			toString: () => `${stream[Symbol.toStringTag]} (${get()})`,
			[Symbol.toStringTag]: 'Stream'
		},
		Monad({ of, get, flatten })
	)
}

const isStream = value => value[Symbol.toStringTag] === 'Stream'

Object.assign(Stream, {
	of: Stream,
	flatten: stream => isStream(stream.get()) ? stream.get() : stream.of(stream.get())
})
