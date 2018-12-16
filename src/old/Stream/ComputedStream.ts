import { TYPE_COMPUTED_STREAM } from '../constants'
import canGet from './canGet'
import canSet from './canSet'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

const noUpdate = { [`@@${TYPE_COMPUTED_STREAM}/noUpdate`]: true }

const ComputedStream = computeFn => {

	let dependencies = []
	let dependencySubscribers = []

	const computedStream = {
		value: undefined,
		initialized: false,
		active: false,
		dependants: new Set(),
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

	const dependsOn = newDependencies => {
		dependencySubscribers.forEach(subscriber => subscriber.unsubscrube())
		dependencies = newDependencies
		dependencySubscribers = dependencies.map(dependency => dependency.on('propagation', () => {

		}))
	}

	Object.assign(
		computedStream,
		getter,
		{
			compute,
			dependsOn
		}
	)

	compute()

	return computedStream
}

ComputedStream.noUpdate = noUpdate

export default ComputedStream
