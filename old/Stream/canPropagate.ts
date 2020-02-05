import depthFirstTopologicalSort from '../depth-first-topological-sort'
import ComputedStream from './ComputedStream'

const flatMap = fn => array => array.reduce((acc, x) => acc.concat(fn(x)), [])

const removeDuplicates = array => Array.from(new Set(array))

const getDependants = stream => Array.from(stream.dependants)

const getDeepDependants = stream => flatMap
	(dependant => [ dependant, ...getDependants(dependant))
	(getDependants(stream))

const sortGraph = sourceStream => {
	const dependantStreams = removeDuplicates(getDeepDependants(sourceStream))
	const graph = dependantStreams.map(stream => [ stream, getDependants(stream) ])
	const sortedGraph = depthFirstTopologicalSort(graph)
	return sortedGraph
}

/*
Remember that the flat graph of nodes and their dependants from a source node
is not the same as the list of nodes and their dependencies,
which would only be the case if all dependencies of a node happened to depend on the source node or a dependant of it, such that anytime the node changes, it's because all of its dependencies changed. That isn't usually the case.
*/

const canPropagate = stream => {

	let resortRequired = false
	let sortedGraph = []

	const registerDependant = (dependant) => {
		resortRequired = true
		stream.dependants.add(dependant)
	}

	const propagate = () => {
		if (resortRequired) {
			sortedGraph = sortGraph(stream)
			resortRequired = false
		}
		sortedGraph.reduce(
			(updatedStreams, dependant) => {
				const updatedDependencies = dependant.dependencies.filter(
					dependency => updatedStreams.includes(dependency)
				)
				if (updatedDependencies.length) {
					const value = dependant.compute(updatedDependencies)
					if (value !== ComputedStream.noUpdate) {
						updatedStreams.push(dependant)
					}
				}
				return updatedStreams
			},
			[ stream ]
		)
	}

	return {
		registerDependant,
		propagate
	}
}

export default canPropagate

export {
	getDeepDependants,
	sortGraph
}
