import test from 'tape'
import { Stream, combine, immediate, endsOn, endsAbruptly, map, merge } from '../'

const doubleFn = ([ x ], self) => self.set(x.get() * 2)
const liftIdentity = ([ x ], self) => self.set(x.get())

test('ending streams', t => {
  t.test(`end stream's dependants should be computed before ending`, t => {
    const x = Stream()

    let called = false
    const y = map (() => called = true) (x.end)

    t.false(y.end.get())

    x.end.set()

    t.true(called, 'recomputed stream when dependency that is end stream was set')
    t.true(y.end.get(), 'ended stream when dependency that is end stream was set')

    t.end()
  })

  t.test(
    'abruptly ending stream does not recompute before ending',
    t => {
      const x = Stream()
      let yCalled = false
      let zCalled = false
      const y = endsAbruptly(map (() => yCalled = true) (x))
      const z = endsAbruptly(map (() => zCalled = true) (x.end))

      t.false(y.end.get())
      t.false(z.end.get())

      x.end.set()

      t.false(yCalled, 'y did not recompute before ending')
      t.false(zCalled, 'z did not recompute before ending')
      t.true(y.end.get(), 'y ended')
      t.true(y.end.get(), 'z ended')

      t.end()
    }
  )

  t.test('depending on ended stream computes the stream and ends it immediately', t => {
    const x = Stream()
    x.label = 'x'
    x.end.set()
    x.end.label = 'x.end'

    let called = false
    const y = combine
      (() => called = true)
      ([ x.end ])
    y.label = 'y'
    y.end.label = 'y.end'

    t.true(y.end.get())
    t.true(called)

    t.end()
  })

  t.test('ending a stream without dependencies', t => {
    const stream = Stream (1)
    stream.end.set()
    t.true(stream.end.get())

    t.end()
  })

  t.test('ending a stream ends its dependants by default', t => {
    const x = Stream (3)
    const y = combine (doubleFn) ([ x ])
    const z = combine (doubleFn) ([ y ])

    t.equal(z.get(), x.get() * 2 * 2)

    x.end.set()

    t.true(x.end.get())
    t.true(y.end.get())
    t.true(z.end.get())

    t.equal(x.dependants.size, 0)
    t.equal(y.dependants.size, 0)

    t.end()
  })

  t.test('ending a stream detaches it from its dependencies', t => {
    const x = Stream(3)
    const y = Stream(2)
    const z = combine
      (([ x, y ]) => y.get() * x.get())
      ([x, y])

    t.equal(x.dependants.size, 1)
    t.equal(y.dependants.size, 1)

    z.end.set()

    t.equal(x.dependants.size, 0)
    t.equal(y.dependants.size, 0)
    t.true(z.end.get())

    t.end()
  })

  t.test('end stream can be set on top level stream', t => {
    const killer = Stream ()
    const stream = endsOn ([ killer ]) (Stream (1))

    t.false(stream.end.get())

    killer(true)

    t.true(stream.end.get())

    t.end()
  })

  t.test('end stream can be changed without affecting listeners', t => {
    const killer1 = Stream()
    const killer2 = Stream()
    const x = Stream(1)

    const y = endsOn
      ([ killer1 ])
      (combine (doubleFn) ([ x ]))

    t.equal(y.get(), 2)

    x.end.set(true)

    t.false(y.end.get(), 'y did not end on its dependency x')

    let ended = false
    map (() => ended = true) (y.end)

    t.false(ended)

    endsOn ([ killer2 ]) (y)

    t.false(ended)

    killer2.set(true)

    t.true(y.end.get())
    t.true(ended)

    t.end()
  })

  t.test(`if a stream's dependencies and its end stream's dependencies both have changed within the same update cycle, it recomputes and ends`, t => {
    const x = Stream (3)
    const y = combine (liftIdentity) ([ x ])
    const z = combine (liftIdentity) ([ y ])

    const xIsZero = combine
      (([ x ], self) => {
        if (x.get() === 0) {
          self.set(true)
        }
      })
      ([ x ])
    xIsZero.label = 'xIsZero'

    endsOn ([ xIsZero ]) (y)

    t.equal(y.get(),  3)
    t.equal(y.get(),  z.get())

    x.set(2)

    t.equal(y.get(),  2)
    t.equal(y.get(),  z.get())

    t.false(x.end.get())
    t.false(y.end.get())
    t.false(z.end.get())

    x.set(0)

    t.true(y.end.get())
    t.true(z.end.get())

    t.equal(x.dependants.size, 1)
    t.equal(y.dependants.size, 0)

    t.equal(y.get(), 0)
    t.equal(z.get(), 0)

    t.end()
  })

  t.test(`if an abruptly ending stream's dependencies and its end stream's dependencies both have changed within the same update cycle, it does not recompute - it just ends`, t => {
    const x = Stream (3)
    const y = endsAbruptly(combine (liftIdentity) ([ x ]))
    const z = combine (liftIdentity) ([ y ])

    const xIsZero = combine
      (([ x ], self) => {
        if (x.get() === 0) {
          self.set(true)
        }
      })
      ([ x ])
    xIsZero.label = 'xIsZero'

    endsOn ([ xIsZero ]) (y)

    t.equal(y.get(),  3)
    t.equal(y.get(),  z.get())

    x.set(2)

    t.equal(y.get(),  2)
    t.equal(y.get(),  z.get())

    t.false(x.end.get())
    t.false(y.end.get())
    t.false(z.end.get())

    x.set(0)

    t.true(y.end.get())
    t.true(z.end.get())

    t.equal(x.dependants.size, 1)
    t.equal(y.dependants.size, 0)

    t.equal(y.get(), 2)
    t.equal(z.get(), 2)

    t.end()
  })
})
