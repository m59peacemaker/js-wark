import test from 'tape'
import { Stream, combine, immediate, endsOn, map, merge } from './'

const doubleFn = ([ x ], self) => self.set(x.get() * 2)
const sumFn = ([ x, y ], self) => self.set(x.get() + y.get())
const liftIdentity = ([ x ], self) => self.set(x.get())

test('stream.get() returns initialValue', t => {
  const n = Stream(0)
  t.equal(n.get(), 0)
  t.end()
})

test('stream.set() updates value', t => {
  const n = Stream(0)
  n.set(10)
  t.equal(n.get(), 10)
  n.set(30)
  t.equal(n.get(), 30)

  t.end()
})

test('combineFn is called immediately if dependencies are initialized', t => {
  t.plan(1)

  combine (() => t.pass()) ([ Stream(0) ])
})

test('combineFn is not called immediately if dependencies are not initialized', t => {
  t.plan(1)

  combine (t.fail) ([ Stream(0), Stream() ])
  t.equal(t.assertCount, 0)
})

test('combineFn gets an array of dependencies', t => {
  t.plan(2)

  combine
    (([ a, b ]) => {
      t.equal(a.get(), 4)
      t.equal(b.get(), 3)
    })
    ([ Stream(4), Stream(3) ])
})

test('immediate(stream) calls a dependant stream body even though dependencies are not ready', t => {
  t.plan(1)
  immediate (combine (([ a ]) => t.false(a.initialized)) ([ Stream() ]))
})

test('map()', t => {
  const n = Stream()
  const n2 = map (v => v * 2) (n)
  t.equal(n2.get(), undefined)

  const nNow = immediate (map (v => v === undefined) (n))
  t.true(nNow.get())

  n.set(1)

  t.equal(n2.get(), 2)

  n.set(0)

  t.equal(n2.get(), 0)

  t.end()
})

test('merge() when deps are not initialized', t => {
  const a = Stream()
  const b = Stream()
  const ab = merge([ a, b ])

  let count = 0
  const abmap = map (() => ++count) (ab)

  a.set(1)
  t.equal(ab.get(), 1)
  b.set(2)
  t.equal(ab.get(), 2)
  b.set(3)
  t.equal(ab.get(), 3)
  a.set('hey')
  t.equal(ab.get(), 'hey')

  t.equal(count, 4)

  t.end()
})

test('merge() when all deps are initialized', t => {
  const s = merge([ Stream(0), Stream(1) ])
  t.equal(s.get(), 0)

  t.end()
})

test('merge() when one dep is initialized', t => {
  const a = Stream()
  const b = Stream(1)
  const ab = merge([ a, b ])

  t.equal(ab.get(), 1)

  a.set(0)

  t.equal(ab.get(), 0)

  b.set(11)

  t.equal(ab.get(), 11)

  t.end()
})

test('atomic updates', t => {
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

// TODO: what is supposed to happen here?
test.skip('multiple sets within combineFn', t => {
  const a = Stream()

  const b = combine
    (([ a ], self) => {
    self.set(a.get())
    self.set(a.get() + 1)
    })
    ([ a ])

  let count = 0
  map (() => ++count) (b)

  a.set(1)

  t.equal(b.get(), 2)
  t.equal(count, 2) // or 1?

  t.end()
})

test('creating and combining streams inside of a stream body', t => {
  const n = Stream (1)
  const nPlus = map (v => v + 100) (n)
  t.equal(nPlus.get(), 101)

  map
    (() => {
      const n = Stream(1)
      const nPlus = map (v => v + 100) (n)
      t.equal(nPlus.get(), 101)
    })
    (Stream (1))

  t.end()
})

test('ending a stream', t => {
  t.test('works for streams without dependencies', t => {
    const stream = Stream (1)
    stream.end.set()
    t.true(stream.end.get())

    t.end()
  })

  t.test('ends its dependants', t => {
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

  t.test('detaches it from dependencies', t => {
    const x = Stream(3)
    const y = Stream(2)
    const z = combine (([ x, y ]) => y.get() * x.get()) ([x, y])

    t.equal(x.dependants.size, 1)
    t.equal(y.dependants.size, 1)

    z.end.set()

    t.equal(x.dependants.size, 0)
    t.equal(y.dependants.size, 0)
    t.true(z.end.get())

    t.end()
  })

  t.test('endsOn(stream, streamToEnd)', t => {
    const a = Stream()
    const b = Stream()
    const c = combine (() => {}) ([ a ])
    endsOn (b) (c)

    a.end.set()

    t.true(a.end.get())
    t.false(c.end.get())

    b.set('holla')

    t.false(b.end.get())
    t.true(c.end.get())

    t.end()
  })

  t.test('endsOn(stream.end, streamToEnd)', t => {
    const a = Stream()
    const b = Stream()
    const c = combine (() => {}) ([ a ])
    endsOn (b.end) (c)

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

  t.test('updates children if stream ends after recieving value', t => {
    const x = Stream (3)
    const y = combine (liftIdentity) ([ x ])
    //const z = combine (liftIdentity) ([ y ])

    const xIsZero = combine
      (([ x ], self) => {
        if (x.get() === 0) {
          self.set(true)
        }
      })
      ([ x ])

    endsOn (xIsZero) (y)

    t.equal(y.get(),  3)
    //t.equal(y.get(),  z.get())

    x.set(2)

    //t.equal(y.get(),  2)
    //t.equal(y.get(),  z.get())

    t.false(x.end.get())
    t.false(y.end.get())
    //t.false(z.end.get())
    return t.end()
    x.get(0)

    t.true(y.end.get())
    t.true(z.end.get())

    t.equal(2, y.get())
    t.equal(2, z.get())

    t.equal(x.dependants.size, 1)
    t.equal(y.dependants.size, 0)

    t.end()
  })
  return
  t.test('works if end stream has initial value', t => {
    const killer = stream(true)
    const x = stream(1)
    const y = flyd.endsOn(killer, combine(doubleFn, [x]))
    x(2)
    t.equal(undefined, y.end())
    t.equal(2 * x(), y())
  })
  t.test('end stream does not have value even if base stream has initial value', t => {
    const killer = stream(true)
    const x = stream(1)
    const y = flyd.endsOn(killer, combine(doubleFn, [x]))
    t.equal(false, y.end.hasVal)
  })
  t.test('ends stream can be changed without affecting listeners', t => {
    const killer1 = stream()
    const killer2 = stream()
    const ended = false
    const x = stream(1)
    const y = flyd.endsOn(killer1, combine(doubleFn, [x]))
    flyd.map(function() {
      ended = true
    }, y.end)
    flyd.endsOn(killer2, y)
    killer2(true)
    t(ended)
  })
  t.test('end stream can be set on top level stream', t => {
    const killer = stream()
    const s = flyd.endsOn(killer, stream(1))
    t.notEqual(s.end(), true)
    killer(true)
    t.equal(s.end(), true)
  })
})
