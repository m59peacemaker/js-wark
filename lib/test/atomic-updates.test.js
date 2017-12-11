import test from 'tape'
import { Stream, combine, map } from '../'

test('atomic updates', t => {
  t.plan(3)

  const a = Stream()
  const b = map (v => v + 1) (a)
  const c = map (v => -1) (a)
  const d = combine
    (([ b, c ], self) => {
      self.set(b.get() + c.get())
    })
    ([ b, c ])

  let timesCalled = 0
  const e = combine
    ((dependencies, self, changedDependencies) => {
      t.deepEqual(changedDependencies, [ d ])
      ++timesCalled
    })
    ([ d ])

  a.set(0)
  a.set(10)

  t.equal(timesCalled, 2)

  t.end()
})
