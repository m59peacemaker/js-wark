const TYPE_STATE = 'WarkVariable'

const Variable = value => {
	const get = () => value
	const set = newValue => value = newValue
	return {
		get,
		set
		[Symbol.toStringTag]: TYPE_STATE
	}
}

const ComputedVariable = compute => {
	const get = () => compute()
	return {
		get,
		[Symbol.toStringTag]: TYPE_STATE
	}
}

const isVariable = value => value[Symbol.toStringTag] === TYPE_STATE

const of = value => Variable(value)

const map = fn => variable => ComputedVariable(() => fn(variable.get()))

const lift = fn => variables => ComputedVariable(() => variables.reduce((fn, variable) => fn(variable.get()), fn))

const lift2 = fn => a => b => lift (fn) ([ a, b ])

const lift3 = fn => a => b => c => lift (fn) ([ a, b, c ])

const ap => variableOfFn => variableOfValue => lift
	(fn => value => fn(value))
	([ variableOfFn, variableOfValue ])

const flatten = variable => map (value => isVariable(value) ? variable.get() : value) (variable)

const flatMap = fn => variable => map (fn) (flatten(variable))

const chain = flatMap

export default Variable

export {
	of,
	map,
	lift,
	lift2,
	lift3,
	ap,
	flatten,
	flatMap,
	chain
}
