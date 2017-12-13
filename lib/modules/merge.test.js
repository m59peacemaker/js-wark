import test from 'tape'
import { Stream, combine } from '../'
import { map, merge } from './'

test('merge', t => {
  t.test('when deps are not initialized', t => {
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

  t.test('when all deps are initialized', t => {
    const s = merge([ Stream(0), Stream(1) ])
    t.equal(s.get(), 0)

    t.end()
  })

  t.test('when one dep is initialized', t => {
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

  t.test('ends when all streams are ended', t => {
    const a = Stream()
    const b = Stream()
    const ab = merge([ a, b ])

    a.end.set(true)

    t.false(ab.end.get())

    b.end.set(true)

    t.true(ab.end.get())

    t.end()
  })
})
