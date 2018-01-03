import test from 'tape'
import { Stream } from '../../'
import { map, skipRepeatsWith } from '../'
const is = a => b => Object.is(a, b)

test('skipRepeatsWith', t => {
  t.test('does not emit values that match the predicate with the previous value', t => {
    const a = Stream()
    const b = skipRepeatsWith (is) (a)
    let count = 0
    map (() => ++count) (b)
    a(1)
    a(1)
    a(1)

    t.equal(count, 1)

    t.end()
  })

  t.test('does emit values that match the predicate with the previous value', t => {
    const a = Stream(1)
    const b = skipRepeatsWith (is) (a)
    let count = 0
    map (() => ++count) (b)
    a(2)
    a(3)
    a(4)
    a(5)

    t.equal(count, 5)

    t.end()
  })

  t.test('emits the value of source without repeats', t => {
    const a = Stream(1)
    const b = skipRepeatsWith (a => b => typeof a === 'string' && typeof b === 'string') (a)

    t.equal(b.get(), 1)

    a.set('foo')

    t.equal(b.get(), 'foo')

    a.set('bar')

    t.equal(b.get(), 'foo')

    a.set('baz')

    t.equal(b.get(), 'foo')

    a.set(false)

    t.equal(b.get(), false)

    t.end()
  })

  t.test('ends when source stream ends', t => {
    const a = Stream()
    const b = skipRepeatsWith (is) (a)
    a.end()

    t.true(b.end.get())

    t.end()
  })
})
