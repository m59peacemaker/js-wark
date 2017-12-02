const isDescendantOfTree = getChildren => tree => subjectNode => tree.find(
  node => node === subjectNode
    || isDescendantOfTree (getChildren) (getChildren(node)) (subjectNode)
)

const nodeWithInfo = node => ({ node, signaledBy: [] })

const signalDescendantsAtomically = options => nodeInfo => queue => {
  const { signal, getChildren } = options
  const { node, signaledBy } = nodeInfo

  if (isDescendantOfTree (getChildren) ([ ...queue.keys() ]) (node)) {
    queue.delete(node)
    queue.set(node, nodeInfo)
  } else {
    const replied = signal(node, signaledBy)

    const children = (replied ? getChildren(node) : [])
      .map(child => queue.get(child) ? queue.get(child) : nodeWithInfo(child))

    children.forEach(child => {
      child.signaledBy.push(node)
      queue.delete(child.node)
      queue.set(child.node, child)
    })
  }

  if (queue.size) {
    const nextNodeInfo = queue.values().next().value
    queue.delete(nextNodeInfo.node)

    return signalDescendantsAtomically
      (options)
      (nextNodeInfo)
      (queue)
  }
}

export default options => node => signalDescendantsAtomically
  (options)
  (nodeWithInfo(node))
  (new Map())
