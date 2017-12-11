import test from 'tape'
import { Stream } from '../'
import { reject } from './'

test('reject', t => {
  t.test('rejects', t => {
    const n = Stream(2)
    const even = reject (v => v % 2) (n)
    t.equal(even.get(), 2)

    n.set(1)

    t.equal(even.get(), 2)

    n.set(10)

    t.equal(even.get(), 10)

    n.set(7)

    t.equal(even.get(), 10)

    t.end()
  })

  t.test('ends with source stream', t => {
    const n = Stream()
    const even = reject (v => v % 2) (n)
    n.end()

    t.true(even.end.get())

    t.end()
  })
})
