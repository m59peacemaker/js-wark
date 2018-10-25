import ComputedStream from './Stream/ComputedStream'

const combine = combineFn => dependencies => {
	const computedStream = ComputedStream(combineFn, dependencies)

	dependencies.forEach(dependency => dependency.registerDependant(computedStream))
	computedStream.computeIfActive()

	return computedStream
}

export default combine
