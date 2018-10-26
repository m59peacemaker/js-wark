import canGetSet from './canGetSet'
import canPropagate from './canPropagate'
import { TYPE_COMPUTED_STREAM } from '../constants'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

const ComputedStream = computeFn => dependencies => {

	function computedStream (value) {
		assertStreamNotEnded(computedStream)
		getterSetter.set(value)
		computedStream.propagate()
	}

	const update = value => {
		assertStreamNotEnded(computedStream)
		getterSetter.set(value)
		computedStream.onUpdate && computedStream.onUpdate()
	}

	const compute = (updatedDependencies = []) => {
		assertStreamNotEnded(computedStream)
		computedStream.active = computedStream.active || allDependenciesInitialized()
		if (!computedStream.active) {
			return
		}
		return computeFn(computedStream, dependencies, updatedDependencies)
	}

	const allDependenciesInitialized = () => dependencies.every(dependency => dependency.initialized)

	const getterSetter = canGetSet(computedStream)

	const end = EndStream()

	Object.assign(
		computedStream,
		getterSetter,
		dependencies,
		canPropagate(computedStream),
		{
			value: undefined,
			initialized: false,
			active: false,
			dependants: new Set(),
			set: computedStream,
			compute,
			update,
			onUpdate: undefined,
			end,
			[Symbol.toStringTag]: TYPE_COMPUTED_STREAM
		}
	)

	dependencies.forEach(dependency => dependency.registerDependant(computedStream))
	compute()

	return computedStream
}

export default ComputedStream
