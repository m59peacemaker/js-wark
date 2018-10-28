import { TYPE_COMPUTED_STREAM } from '../constants'
import canGet from './canGet'
import canSet from './canSet'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

const noUpdate = { [`@@${TYPE_COMPUTED_STREAM}/noUpdate`]: true }

const ComputedStream = computeFn => dependencies => {

	const computedStream = {
		value: undefined,
		initialized: false,
		active: false,
		dependants: new Set(),
		dependencies,
		end: EndStream(),
		[Symbol.toStringTag]: TYPE_COMPUTED_STREAM
	}

	const getter = canGet(computedStream)
	const setter = canSet(computedStream)

	const allDependenciesInitialized = () => dependencies.every(dependency => dependency.initialized)

	const compute = (updatedDependencies = []) => {
		assertStreamNotEnded(computedStream)
		computedStream.active = computedStream.active || allDependenciesInitialized()
		if (!computedStream.active) {
			return noUpdate
		}
		const value = computeFn(dependencies, updatedDependencies)
		if (value !== noUpdate) {
			setter.set(value)
		}
		return value
	}

	const registerDependant = stream => computedStream.dependants.add(stream)

	Object.assign(
		computedStream,
		getter,
		{
			compute,
			registerDependant
		}
	)

	dependencies.forEach(dependency => dependency.registerDependant(computedStream))
	compute()

	return computedStream
}

ComputedStream.noUpdate = noUpdate

export default ComputedStream
