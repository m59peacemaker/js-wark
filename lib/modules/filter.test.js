import test from 'tape'
import { Stream } from '../'
import { filter } from './'

test('filter', t => {
  t.test('filters', t => {
    const n = Stream(2)
    const odd = filter (v => v % 2) (n)
    t.equal(odd.get(), undefined)

    n.set(1)

    t.equal(odd.get(), 1)

    n.set(9)

    t.equal(odd.get(), 9)

    n.set(8)

    t.equal(odd.get(), 9)

    t.end()
  })

  t.test('ends with source stream', t => {
    const n = Stream()
    const odd = filter (v => v % 2) (n)
    n.end()

    t.true(odd.end.get())

    t.end()
  })
})
