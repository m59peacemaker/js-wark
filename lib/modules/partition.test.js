import test from 'tape'
import { Stream } from '../'
import { partition } from './'

test('partition', t => {
  t.test(`returns a stream that filters on the predicate and a stream that rejects on the predicate`, t => {
    const n = Stream(2)
    const [ odd, even ] = partition (v => v % 2) (n)

    t.equal(odd.get(), undefined)
    t.equal(even.get(), 2)

    n.set(1)

    t.equal(odd.get(), 1)
    t.equal(even.get(), 2)

    n.set(9)

    t.equal(odd.get(), 9)

    n.set(8)

    t.equal(odd.get(), 9)
    t.equal(even.get(), 8)

    t.end()
  })

  t.test('both streams end when the source stream ends', t => {
    const n = Stream()
    const [ odd, even ] = partition (v => v % 2) (n)
    n.end()

    t.true(odd.end.get())
    t.true(even.end.get())

    t.end()
  })
})
