import test from 'tape'
import { Stream, combine, immediate, map, merge } from './'

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

test('very uncool dependency prollem', t => {
  const a = Stream()
  a.label = 'a'
  const b = map (v => v + 1) (a)
  b.label = 'b'
  const c = map (v => -1) (a)
  c.label = 'c'
  const bc = combine
    (([ b, c ], self) => {
      self.set(b.get() + c.get())
    })
    ([ b, c ])
  bc.label = 'bc'

  let timesCalled = 0
  const bcmap = map (v => ++timesCalled) (bc)
  bcmap.label = 'bcmap'

  a.set(0)
  a.set(10)

  t.equal(timesCalled, 2)

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
