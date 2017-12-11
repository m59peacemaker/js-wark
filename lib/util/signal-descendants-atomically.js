import getFlatDescendantMap from './getFlatDescendantMap'
import until from './until'
import reduceWhile from './reduceWhile'

const none = predicate => array => !array.some(predicate)

/*
  atomic signaling a tree of nodes
  1. nodes may appear multiple places within the tree
  2. nodes can be signaled and then signal descendant nodes (signal cycle)
  3. during a signal cycle (2), a node may only be signaled once, even though it may be a descendant of multiple nodes that are signaled
    3.a to be signaled:
      3.a.1 one of a node's direct parents must have been signaled
      3.a.2 and no other nodes that meet criteria 1 that are not yet signaled have a descendant that is the node or a node mutually exclusive with the node (4)
  4. some nodes may be mutually exclusive - if one node is to be signaled, the other must not be
  when mutually exclusive nodes are encountered, a node may take priority over another node based on some criteria
  5. the one signal for a node should be the last one possible - it should occur at the point that no other nodes to be signaled have this node or a node mutually exclusive with it as a descendant
  6. when signaling a node, it should be informed of what immediate parent nodes were signaled and replied (and thus would cause this node to be signaled)
  7. when a node is signaled,
    7.a it may acknowledge the signal or disregard it
    7.b a node's children should not be considered for signaling unless it acknowledged the signal
*/

export default options => sourceNode => {
  const { signal, discoverNodes, determineMutualExclusivity } = options

  // 3.
  const signalCandidates = new Set()
  const descendantMap = getFlatDescendantMap ({ getChildren: discoverNodes }) (sourceNode)

  // 6.
  const discoveryLog = new Map()

  const anyDescendantIsOrIsMutuallyExclusiveWith = candidate => otherCandidate =>
    [ ...descendantMap.get(otherCandidate) ]
      .some(
        descendant =>
          descendant === candidate
          || determineMutualExclusivity (descendant) (candidate)
      )

  const rotateToNextCandidate = () => {
    let i = 0
    const maxRotations = signalCandidates.size
    while (i < maxRotations) {
      ++i

      const [ candidate, ...otherCandidates ] = [ ...signalCandidates ]
      signalCandidates.delete(candidate)

      // 5.
      const canBeSignaled = none
        (anyDescendantIsOrIsMutuallyExclusiveWith (candidate))
        (otherCandidates)

      if (canBeSignaled) {
        return candidate
      } else {
        signalCandidates.add(candidate)
      }
    }
  }

  const determineNeededCandidateUpdate = possibleCandidate => currentCandidate => {
    // 3.
    if (currentCandidate === possibleCandidate) {
      return { remove: currentCandidate, accept: possibleCandidate }
    }

    // 4.
    const preferredNode = determineMutualExclusivity (possibleCandidate) (currentCandidate)
    if (preferredNode) {
      return { remove: currentCandidate, accept: preferredNode }
    }

    return null
  }

  // look at one possible candidate, compare against all current candidates to see if any adjustments need to occur, or if it just needs to be added on the end
  const adjustSignalCandidatesWith = possibleCandidate => {
    const candidateUpdate = reduceWhile
      (v => v === null)
      ((_, candidate) => determineNeededCandidateUpdate (possibleCandidate) (candidate))
      (null)
      ([ ...signalCandidates ])

    if (candidateUpdate) {
      const { remove, accept } = candidateUpdate
      remove && signalCandidates.delete(remove)
      signalCandidates.add(accept)
    } else {
      signalCandidates.add(possibleCandidate)
    }
  }

  const signalDescendantsAtomically = node => {
    // 2.
    discoverNodes (node)
      // 3.a.1
      .forEach(child => {
        // 6.
        discoveryLog.set(
          child,
          [ ...(discoveryLog.get(child) || []), node ]
        )

        // 3. and 4.
        adjustSignalCandidatesWith (child)
      })

    // 7.a
    const nodeThatReplied = until
      (candidate => {
        if (!candidate) {
          return true
        }

        const nodeReplied = signal (candidate) (discoveryLog.get(candidate))
        return nodeReplied
      })
      (rotateToNextCandidate)
      (rotateToNextCandidate())

    // 7.b
    return nodeThatReplied
      // 2.
      ? signalDescendantsAtomically (nodeThatReplied)
      : undefined
  }

  return signalDescendantsAtomically (sourceNode)
}
