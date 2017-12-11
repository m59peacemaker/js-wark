import test from 'tape'
import getFlatDescendantMap from './getFlatDescendantMap'

test('getFlatDescendantMap', t => {
  t.test('normal dependency tree', t => {
    const a = { name: 'a' }
    const b = { name: 'b' }
    const c = { name: 'c' }
    const d = { name: 'd' }
    const e = { name: 'e' }
    a.children = [ b, e ]
    b.children = [ c, d ]
    c.children = [ e ]
    d.children = [ c, e ]
    e.children = []

    const getChildren = node => node.children
    const result = getFlatDescendantMap ({ getChildren }) (a)
    ;[
      [ a, [ b, e, c, d ] ],
      [ b, [ c, d, e ] ],
      [ c, [ e ] ],
      [ d, [ c, e ] ],
      [ e, [] ]
    ].forEach(([ node, expected ]) => t.deepEqual([ ...result.get(node) ], expected))

    t.end()
  })

  t.test('getFlatDescendantMap with circular dependency', t => {
    const a = { name: 'a' }
    const b = { name: 'b' }
    const c = { name: 'c' }
    const d = { name: 'd' }
    a.children = [ b, c, d ]
    b.children = []
    c.children = [ d ]
    d.children = [ c ]

    const getChildren = node => node.children
    const toNames = node => [ node.name, node.children.map(child => child.name) ]
    const result = getFlatDescendantMap ({ getChildren }) (a)
    ;[
      [ a, [ b, c, d ] ],
      [ b, [] ],
      [ c, [ d, c ] ],
      [ d, [ c, d ] ]
    ].forEach(([ node, expected ]) => {
      t.deepEqual(
        [ ...result.get(node) ].map(toNames),
        expected.map(toNames),
        node.name
      )
    })

    t.end()
  })
})
