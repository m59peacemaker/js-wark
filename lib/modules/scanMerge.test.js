import test from 'tape'
import { Stream } from '../'
import { map, merge, scan, scanMerge } from './'

test('scanMerge', t => {
  t.test('uses initial value when no given streams are not initialized', t => {
    const a = Stream()
    const b = Stream()
    const c = scanMerge
      ([
        [ a, acc => v => acc + v ],
        [ b, acc => v => acc + v ]
      ])
      (0)

    t.equal(c.get(), 0)

    t.end()
  })

  t.test('initally accumulates a value from reducers of streams that are initialized', t => {
    const a = Stream(5)
    const b = Stream(7)
    const c = scanMerge
      ([
        [ a, acc => v => acc + v ],
        [ b, acc => v => acc + v ]
      ])
      (3)

    t.equal(c.get(), 15)

    t.end()
  })

  t.test('initally accumulates a value from reducers when some streams are initialized', t => {
    const a = Stream()
    const b = Stream(7)
    const c = scanMerge
      ([
        [ a, acc => v => acc + v ],
        [ b, acc => v => acc + v ]
      ])
      (3)

    t.equal(c.get(), 10)

    b.set(4)

    t.equal(c.get(), 14)

    a.set(1)

    t.equal(c.get(), 15)

    t.end()
  })

  t.test('reducer is optional, value from stream is accumulated (like a regular merge)', t => {
    const a = Stream(12)
    const b = Stream()
    const c = scanMerge
      ([
        a,
        [ b, acc => v => acc + v ]
      ])
      (0)

    let count = 0
    map (() => ++count) (c)

    t.equal(count, 1)

    t.equal(c.get(), 12)

    a.set(4)

    t.equal(c.get(), 4)

    b.set(11)

    t.equal(c.get(), 15)

    a.set(5)

    t.equal(c.get(), 5)

    b.set(14)

    t.equal(c.get(), 19)
    t.equal(count, 5)

    t.end()
  })

  t.test('with other combinators and operators', t => {
    const a = Stream()
    const b = Stream(4)
    const c = map (v => v + 5) (b)
    const abc = merge([a, b, c ])
    const d = scanMerge
      ([
        a,
        [ b, acc => v => acc + v ],  // 0 + 4 = 4, 9 + 8 = 17
        [ c, acc => v => acc + v ], // 4 + 9 = 13, 17 + 13 = 30,
        [ abc, acc => v => acc - v ] // 13 - 4 = 9, 30 - 8 = 22, 3 - 3 = 0
      ])
      (0)
    const e = scan (acc => v => acc + 1) (0) (d)

    t.equal(b.get(), 4)
    t.equal(c.get(), 9)
    t.equal(abc.get(), 4)
    t.equal(d.get(), 9)
    t.equal(e.get(), 1)

    b.set(8)

    t.equal(d.get(), 22)

    a.set(3)

    t.equal(d.get(), 0)

    t.equal(e.get(), 3)

    t.end()
  })

  t.test('ends when all streams are ended', t => {
    const a = Stream()
    const b = Stream()
    const c = Stream()
    const d = scanMerge
      ([ [ a ], [ b ], [ c ] ])
      ()

    t.false(d.end.get())
    a.end()
    t.false(d.end.get())
    b.end()
    t.false(d.end.get())
    c.end()
    t.true(d.end.get())

    t.end()
  })
})
