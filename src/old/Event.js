const Moment = () => {
	const occur = () => {
		++occurrences
	}

	return {
		state,
		occur
	}
}

MomentState :: State n
Moment :: () -> State occurrences

// event is a state at an occurrence
// what is an occurrence? The invocation of `occur` on a moment
// a moment is the in

// Event :: forall x a. (...x -> a) -> [State x] -> Event { Moment, State }
// occur :: () -!-> a
// type State a = { get: IO a }

// return { get: IO.map(f)(Arr.traverse(IO)(s => s.get)(ss)) }


const Event = () => {
	const occur = () => {}
}
