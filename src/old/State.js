
// State :: forall x a. (...x -> a) -> [State x] -> State a
// get :: () -!-> a
// type State a = { get: IO a }

// return { get: IO.map(f)(Arr.traverse(IO)(s => s.get)(ss)) }

const State = computation => dependencies => {
	const state = {
		value: undefined,
		stale: true
	}

	const emitter = Emitter()

	const set = value => {
		state.value = value
		state.stale = false
		emitter.emit ('change', value)
	}

	const compute = () => {
		const dependencyValues = dependencies.map(dependency => dependency.value)
		const computedValue = computation(...dependencyValues)
		set(computedValue)
	}

	const get = () => {
		if (state.stale) {
			compute()
		}
		return state.value
	}


	dependencies.forEach(dependency => {
		dependency.on('change', () => {
			state.stale = true
		})
	})

	return Object.assign(
		state,
		emitter,
		{
			set,
			get
		}
	)
}

const of = value => State({ computation: () => value })
const lift = fn => states => State({ computation: fn: dependencies: states })
const map = fn => state => lift (fn) ([ state ])
const ap => stateOfFn => state => lift (fn => fn) ([ stateOfFn, state ])

// This might be an issue, because it returns a state that doesn't depend on the inner state... it may not need to, though
const flatten = stateOfState => map (innerState => innerState.get()) (stateOfState)
// if that's an issue, then this might work, albeit awkward... perhaps giving a State a way to update dependencies will be better, but also unfortunate
// or maybe give State a temporary or secondary dependency api
const flatten = stateOfState => {
	let innerStateSubscription
	return map
		(innerState => {
			// manually hook up the temporary dependency
			innerStateSubscription && innerStateSubscription.unsubscribe()
			innerStateSubscription = innerState.on('change', () => flatState.stale = true)
			return innerState.get()
		})
		(stateOfState)
}

const chain = fn => flatten(map(fn))
const flatMap = chain

const stateA = State.of(1)
const stateB = State.of(2)
const stateOfState = State.of(stateA)
const aOrB = State.flatten(stateOfState)
aOrB.get() // 1
stateA.set(5)
aOrB.get() // 5
stateOfState.set(stateB)
aOrB.get() // 2

export default State

export {
	ap,
	chain,
	flatMap,
	lift,
	map,
	of
}
