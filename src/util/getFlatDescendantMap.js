export default ({ getChildren }) => node => {
  const map = new Map()

  const addNodeToMap = node => {
    const children = getChildren (node)
    const descendants = new Set(children)
    map.set(node, descendants)

    children
      .forEach(child => {
        if (!map.has(child)) {
          addNodeToMap (child)
        }

        map.get(child).forEach(descendant => descendants.add(descendant))
      })

    return map
  }

  return addNodeToMap (node)
}
