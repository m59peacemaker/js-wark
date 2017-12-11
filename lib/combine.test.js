import test from 'tape'
import { Stream, combine } from '../'

const doubleFn = ([ x ], self) => self.set(x.get() * 2)

test('combine', t => {
  t.test('combineFn is called immediately if dependencies are initialized', t => {
    t.plan(1)

    combine (() => t.pass()) ([ Stream(0) ])
  })

  t.test('combineFn is not called immediately if dependencies are not initialized', t => {
    t.plan(1)

    combine (t.fail) ([ Stream(0), Stream() ])
    t.equal(t.assertCount, 0)
  })

  t.test('combineFn gets an array of dependencies', t => {
    t.plan(2)

    combine
      (([ a, b ]) => {
        t.equal(a.get(), 4)
        t.equal(b.get(), 3)
      })
      ([ Stream(4), Stream(3) ])
  })

  t.test('creating and combining streams inside of a stream body', t => {
    const n = Stream (1)
    const nPlus = combine
      (([ n ], self) => self.set(n.get() + 100))
      ([ n ])
    t.equal(nPlus.get(), 101)

    combine
      (() => {
        const n = Stream(1)
        const nPlus = combine
          (([ n ], self) => self.set(n.get() + 100))
          ([ n ])
        t.equal(nPlus.get(), 101)
      })
      ([ Stream (1) ])

    t.end()
  })

  t.test('setting another stream within combineFn', t => {
    const x = Stream(4)
    const y = Stream(3)
    const z = Stream(1)
    const doubleX = combine (doubleFn) ([x])
    const setAndSum = combine
      (([ y, z ], self) => {
        x.set(3)
        self.set(z.get() + y.get())
      })
      ([y, z])

    z.set(4)

    t.equal(setAndSum.get(), 7)
    t.equal(doubleX.get(), 6)

    t.end()
  })

  t.test('multiple sets within combineFn', t => {
    const a = Stream()

    const b = combine
      (([ a ], self) => {
        self.set(a.get())
        self.set(a.get() + 1)
      })
      ([ a ])

    let count = 0
    const c = combine
      (([ b ], self) => {
        ++count
        self(b.get())
      })
      ([ b ])

    a.set(1)

    t.equal(b.get(), 2)
    t.equal(c.get(), 2)
    t.equal(count, 2)

    a.set(10)

    t.equal(b.get(), 11)
    t.equal(c.get(), 11)
    t.equal(count, 4)

    t.end()
  })

  // TODO: flyd says this should be [ 1, 2 ], but I don't see that as a good thing
  //t.test('executes to the end before handlers are triggered', t => {
  t.test('execution order when setting another stream in a combineFn', t => {
    const order = []
    const x = Stream(4)
    const y = Stream(3)
    const z = combine
      (([ x ], self) => { // executes now
        if (x.get() === 3) {
          order.push(2) // executes when x.set(3) in the next combine
        }
        self.set(x.get() * 2)
      })
      ([ x ])

    t.equal(z.get(), 8)

    combine
      (([ y ], self) => { // executes now
        x.set(3) // triggers combine function above, flyd says it should wait
        order.push(1)
      })
      ([ y ])

    // t.deepEqual(order, [ 1, 2 ])
    t.deepEqual(order, [ 2, 1 ])

    t.end()
  })
})
