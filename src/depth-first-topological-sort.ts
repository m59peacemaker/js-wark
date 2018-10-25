const toDependantMap = graph => graph.reduce(
	(map, [ node, dependants ]) => {
		map.set(node, dependants)
		return map
	},
	new Map()
)

const depthFirstTopologicalSort = inputGraph => {
	const graph = inputGraph.slice(0)
	const dependantMap = toDependantMap(graph)
	const sortedNodes = []

	function visit (node, dependants) {
		if (sortedNodes.includes(node)) {
			return
		}
		if (graph.includes(node)) {
			throw new Error('Graph has a cycle - graph is not a DAG.')
		}
		dependants && dependants.forEach(dependant => visit(dependant, dependantMap.get(dependant)))
		sortedNodes.unshift(node)
	}

	while (graph.length) {
		const [ node, dependants ] = graph.shift()
		visit(node, dependants)
	}

	return sortedNodes
}

export default depthFirstTopologicalSort
