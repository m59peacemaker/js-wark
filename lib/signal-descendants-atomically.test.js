import test from 'tape'
import signalDescendants from './signal-descendants-atomically'

const Node = onSignal => name => ({
  name,
  onSignal,
  signaledBy: [],
  children: [],
  called: 0
})
const Tnode = name => Node (() => true) (name)
const Fnode = name => Node (() => false) (name)

test.only('dat signals', t => {
  /*
    x- (no reply)
  |
  |                            a
  |            /            /    \       \
  |           b            c-     d       e
  |       /     \  \      /\     /  \     /\
  |      d       e   g   e h     c-  e   f- g
  |     /  \    /\      /\      /\  /\   |
  |   c-    e  f- g    f- g    e h f- g  h
  |  / \   /\  |       |      /\   |
  |  e h  f- g h       h     f- g  h
  | / \   |                  |
  |f- g   h                  h
  |

  a signal/reply
  [ b, c, d, e ]
  [ b[a], c[a], d[a], e[a] ]
  b [ c, d, e ]
  b not in tree of [ c, d, e ]
  b [a] signal/reply
  [ c, d, e, d, e, g ]
  [ c, d, e, g ]
  [ c[a], d[a, b], e[a, b], g[b] ]
  c [ d, e, g ]
  c in tree of [ d, e, g ]
  [ d, e, g, c ]
  d [ e, g, c ]
  d not in tree of [ e, g, c ]
  d signal/reply
  [ e, c, g, c, e ]
  [ g, c, e ]
  [ g[b], c[a, d], e[a, b, d] ]
  g [ c, e ]
  g in tree of [ c, e ]
  [ c, e, g ]
  c [ e, g ]
  c not in tree of [ e, g ]
  c signal NO reply
  [ e, g ]
  [ e[a, b, d], g[b] ]
  e [ g ]
  e not in tree of [ g ]
  e signal/reply
  [ g, f, g ]
  [ f, g ]
  [ f[e], g[b, e] ]
  f [ g ]
  f not in tree of [ g ]
  f signal NO reply
  [ g ]
  [ g[b, e] ]
  g [ ]
  g not in tree of [ ]
  g signal/reply
  []
  */

  const a = Tnode('a')
  const b = Tnode('b')
  const c = Fnode('c')
  const d = Tnode('d')
  const e = Tnode('e')
  const f = Fnode('f')
  const g = Fnode('g')
  const h = Tnode('h')
  a.children = [ b, c, d, e ]
  b.children = [ d, e, g ]
  c.children = [ e, h ]
  d.children = [ c, e ]
  e.children = [ f, g ]
  f.children = [ h ]

  signalDescendants
    ({
      getChildren: node => node.children,
      signal: node => signaledBy => {
        node.called = node.called + 1
        node.signaledBy = signaledBy
        return node.onSignal()
      }
    })
    (a)

  ;[ a, b, c, d, e, f, g ].forEach(
    node => t.equal(node.called, 1, `${node.name} was called once`)
  )
  t.equal(h.called, 0, 'h was not called')

  ;[
    [ a, [] ],
    [ b, [ a ] ],
    [ c, [ a, d ] ],
    [ d, [ a, b ] ],
    [ e, [ a, b, d ] ],
    [ f, [ e ] ],
    [ g, [ b, e ] ],
    [ h, [ ] ]
  ].forEach(([ node, signaledBy ]) => {
    t.deepEqual(
      node.signaledBy,
      signaledBy,
      `${node.name} was signaled by ${signaledBy.map(node => node.name)}`
    )
  })

  t.end()
})
