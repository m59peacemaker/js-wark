import test from 'tape'
import { Stream, immediate } from '../'
import { map } from './'

test('map', t => {
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
