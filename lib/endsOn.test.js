import test from 'tape'
import { Stream, combine, endsOn } from '../'

test('endsOn', t => {
  t.test('endsOn (streams) (streamToEnd)', t => {
    const a = Stream()
    const b = Stream()
    const c = combine (() => {}) ([ a ])
    endsOn ([ b ]) (c)

    a.end.set()

    t.true(a.end.get())
    t.false(c.end.get())

    b.set('holla')

    t.false(b.end.get())
    t.true(c.end.get())

    t.end()
  })

  t.test('endsOn ([ stream.end ]) (streamToEnd)', t => {
    const a = Stream()
    const b = Stream()
    const c = combine (() => {}) ([ a ])
    endsOn ([ b.end ]) (c)

    a.end.set()

    t.true(a.end.get())
    t.false(c.end.get())

    b.set('holla')

    t.false(c.end.get())

    b.end.set()

    t.true(b.end.get())
    t.true(c.end.get())

    t.end()
  })

  t.test('if stream to end on already has a value, stream is not ended immediately', t => {
    const killer = Stream (true)
    const x = Stream (1)
    const y = endsOn
      ([ killer ])
      (combine
        (([ x ], self) => self.set(x.get() * 2))
        ([ x ])
      )

    x.get(2)

    t.equal(undefined, y.end())
    t.equal(2 * x.get(), y.get())

    t.end()
  })
})
