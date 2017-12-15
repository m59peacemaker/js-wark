import test from 'tape'
import { Stream } from '../'

test('Stream', t => {
  t.test('stream.get() returns initialValue', t => {
    const n = Stream(0)

    t.equal(n.get(), 0)

    t.end()
  })

  t.test('stream.set() updates value', t => {
    const n = Stream(0)
    n.set(10)

    t.equal(n.get(), 10)

    n.set(30)

    t.equal(n.get(), 30)

    t.end()
  })
})
