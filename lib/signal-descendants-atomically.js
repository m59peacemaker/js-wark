const until = predicate => fn => initialValue => {
  let value = initialValue
  while (!predicate (value)) {
    value = fn(value)
  }
  return value
}

const rotateMap = map => {
  const entries = map.entries()
  const entry = entries.next().value

  if (!map.size) {
    return
  }

  const [ key, value ] = entry

  map.delete(key)
  map.set(key, value)

  return entries.next().value
}

const nodeWithInfo = node => ({ node, signaledBy: [] })

export default options => node => {
  const { signal, getChildren, isSameNode } = options
  const queue = new Map()

  const isDescendantOfAny = nodes => subjectNode => nodes.find(
    node => isSameNode (node) (subjectNode)
      || isDescendantOfAny (getChildren(node)) (subjectNode)
  )

  const signalDescendantsAtomically = parentNode => {
    getChildren(parentNode)
      .map(child => queue.get(child) ? queue.get(child) : nodeWithInfo(child))
      .forEach(child => {
        child.signaledBy.push(parentNode)
        // add or move node to the end of the queue
        queue.delete(child.node)
        queue.set(child.node, child)
      })

    /*
      move the first node to the end of the queue until
        - the first node is not a descendant of any other nodes
        - that node replies (returns true) when signaled
        - there are no more nodes
      remove nodes as they are signaled
     */
    const entry = until
      (([ node, nodeInfo] = []) => {
        if (!queue.size) {
          return true
        }

        const otherNodes = [ ...queue.keys() ].slice(1)
        if (isDescendantOfAny (otherNodes) (node)) {
          return false
        }

        queue.delete(node)
        const replied = signal (node) (nodeInfo.signaledBy)
        return replied
      })
      (() => rotateMap (queue))
      (queue.entries().next().value)

    return entry
      ? signalDescendantsAtomically (entry[0])
      : undefined
  }

  return signalDescendantsAtomically (node)
}
