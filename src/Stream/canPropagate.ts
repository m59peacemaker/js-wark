import depthFirstTopologicalSort from '../depth-first-topological-sort'
import extend from '../util/extend'

const flatMap = fn => array => array.reduce((acc, x) => acc.concat(fn(x)), [])

const removeDuplicates = array => Array.from(new Set(array))

const getDeepDependants = stream => flatMap
  (stream => [ stream, ...stream.getDependants() ])
	(stream.getDependants())

const sortGraph = sourceStream => {
	const dependantStreams = removeDuplicates(getDeepDependants(sourceStream))
	const graph = dependantStreams.map(stream => [ stream, stream.getDependants() ])
	const sortedGraph = depthFirstTopologicalSort(graph)
	return sortedGraph
}

/*
Remember that the flat graph of nodes and their dependants from a source node
is not the same as the list of nodes and their dependencies,
which would only be the case if all dependencies of a node happened to depend on the source node or a dependant of it, such that anytime the node changes, it's because all of its dependencies changed. That isn't usually the case.
*/

const canPropagate = stream => {

	extend(stream, {
		propagationEnabled: true,
		dependants: new Set()
	})

	let resortRequired = false
	let sortedGraph = []

	const registerDependant = (dependant) => {
		resortRequired = true
		stream.dependants.add(dependant)
	}

	const getDependants = () => Array.from(stream.dependants)

	const propagate = () => {
		console.log(stream.label, 'propagate()'
		if (!stream.propagationEnabled) {
			return
		}
		if (resortRequired) {
			sortedGraph = sortGraph(stream)
		  resortRequired = false
		}
		sortedGraph.reduce(
		  (propagationState, dependant) => {
			dependant.propagationEnabled = false
			const unsubscribe = dependant.once('set', () => propagationState.updatedStreams.push(dependant))
			dependant.onPropagation(propagationState)
			unsubscribe()
			dependant.propagationEnabled = true
			return propagationState
		  },
			{ updatedStreams: [ stream ] }
		)
		console.log(stream.label, 'propagation complete')
		sortedGraph.forEach(dependant => dependant.onPropagationComplete())
	}

	return Object.assign(stream, {
		registerDependant,
		getDependants,
		propagate
	})
}

export default canPropagate

export {
	getDeepDependants,
	sortGraph
}
