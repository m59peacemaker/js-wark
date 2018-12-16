import Emitter from '../../kweh'

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

// type dependencies as array of States
const State = ({ computation, dependencies = [] }) => {
	const state = {
		value,
		// stale pull/stale based stuff can probably be added last, if it remains a sound idea
	}

	const compute = () => {
		const dependencyValues = dependencies.map(dependency => dependency.value)
		state.value = computation(...dependencyValues)
		emitter.emit ('change') (state.value)
	}

	dependencies.forEach(dependency => {
		dependency.on('change', compute)
	})

	map

	return Object.assign(
		state,
		{
		}
	)
}

State.of = value => State({ computation: () => value })

const lift = fn => states => State({ computation: fn, dependencies: states })

export default State

export {
	lift
}
//const sample = moment => state => Event({ state, moment })

/* const Moment = () => { */
/* 	const moment = State() */

/* 	const emitter = Emitter() */
	
/* 	const occur = () => { */
/* 		++moment.index */
/* 		emitter.emit ('occurrence') (moment.index) */
/* 	} */

/* 	const combine = anotherMoment => { */
/* 		const combinedMoment = Moment() */
/* 		;[ moment, anotherMoment ].forEach(moment => moment.on('occurrence', combinedMoment.occur)) */
/* 		return combinedMoment */
/* 	} */

/* 	return Object.assign( */
/* 		moment, */
/* 		emitter, */
/* 		{ */
/* 			occur */
/* 		} */
/* 	) */
/* } */

/* const x = fn => initialValue => moments => { */
/* 	moments.forEach( */
/* 		moment => moment.on */
/* 			('occurrence') */
/* 			(() => fn(moments.map(moment => moment.index))) */
/* 	) */
/* } */


/* const Stream = value => { */
/* 	const stream = { */
/* 		value */
/* 	} */

/* 	const of = Stream.of */
/* 	const flatten = () => Stream.flatten(stream) */
/* 	const get = () => stream.value */
/* 	const set = value => { */
/* 		stream.initialized = true */
/* 		stream.value = value */
/* 		stream.emit('propagation') */
/* 	} */

/* 	return Object.assign( */
/* 		stream, */
/* 		{ */
/* 			get, */
/* 			set, */
/* 			flatten, */
/* 			end, */
/* 			toJSON: get, */
/* 			toString: () => `${stream[Symbol.toStringTag]} (${get()})`, */
/* 			[Symbol.toStringTag]: 'Stream' */
/* 		}, */
/* 		Emitter(), */
/* 		Monad({ of, get, flatten }) */
/* 	) */
/* } */

/* const isStream = value => value[Symbol.toStringTag] === 'Stream' */

/* Object.assign(Stream, { */
/* 	of: Stream, */
/* 	flatten: stream => isStream(stream.get()) ? stream.get() : stream.of(stream.get()) */
/* }) */

/* const ComputedStream = computation => { */
/* 	const stream = Stream() */

/* | let stateDependencies = [] */
/* 	let timeDependencies = [] */

/* 	const stateOf = streams => { */
/* 		return stream */
/* 	} */

/* 	const timeOf = streams => { */
/* 		return stream */
/* 	} */

/* 	return Object.assign( */
/* 		stream, */
/* 		{ */
/* 			stateOf, */
/* 			timeOf */
/* 		} */
/* 	) */
/* } */
