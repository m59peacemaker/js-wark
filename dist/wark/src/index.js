var Functor = function (_a) {
    var of = _a.of, get = _a.get;
    return ({
        get: get,
        of: of,
        map: function (fn) { return of(fn(get())); }
    });
};
var Applicative = function (_a) {
    var of = _a.of, get = _a.get;
    return Object.assign(Functor({ of: of, get: get }), { ap: function (type) { return type.map(get()); } });
};
var Monad = function (_a) {
    var of = _a.of, get = _a.get, flatten = _a.flatten;
    var applicative = Applicative({ of: of, get: get });
    return Object.assign(applicative, { chain: function (fn) { return flatten(applicative.map(fn)); } });
};
// type dependencies as array of States
var State = function (_a) {
    var computation = _a.computation, _b = _a.dependencies, dependencies = _b === void 0 ? [] : _b;
    var state = {
        value: value
    };
    var compute = function () {
        var dependencyValues = dependencies.map(function (dependency) { return dependency.value; });
        state.value = computation.apply(void 0, dependencyValues);
        emitter.emit('change')(state.value);
    };
    dependencies.forEach(function (dependency) {
        dependency.on('change', compute);
    });
    map;
    return Object.assign(state, {});
};
State.of = function (value) { return State({ computation: function () { return value; } }); };
var lift = function (fn) { return function (states) { return State({ computation: fn, dependencies: states }); }; };
export default State;
export { lift };
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
