import ComputedStream from './Stream/ComputedStream'

const combine = computeFn => dependencies => {
	const stream = ComputedStream(computeFn)
	stream.dependsOn(dependencies)
	return stream
}

export default combine
