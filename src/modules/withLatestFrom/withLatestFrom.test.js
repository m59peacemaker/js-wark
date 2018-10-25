import test from 'tape'
import { Stream } from '../../'
import { map, withLatestFrom } from '../'

test('withLatestFrom', t => {
  t.test('emits when primary stream emits', t => {
    t.plan(1)

    const a = Stream()
    const b = withLatestFrom ([ Stream() ]) (a)
    map (t.pass) (b)
    a(123)

    t.end()
  })

  t.test('does not emit when other streams emit', t => {
    const a = Stream()
    const b = Stream()
    const c = withLatestFrom ([ b ]) (a)
    let count = 0
    map (() => ++count) (c)

    b.set(123)

    t.false(c.initialized)
    t.equal(c.get(), undefined)

    t.end()
  })

  t.test('emits an array of [ primary value, ...other values ]', t => {
    const a = Stream()
    const b = Stream(456)
    const c = withLatestFrom ([ b ]) (a)

    t.equal(c.get(), undefined)

    a.set(123)

    t.deepEqual(c.get(), [ 123, 456 ])

    t.end()
  })

  t.test('ends when primary stream ends', t => {
    const a = Stream()
    const b = Stream()
    const c = withLatestFrom ([ b ]) (a)
    a.end()

    t.true(c.end.get())

    t.end()
  })

  t.test('does not end when other streams end', t => {
    const a = Stream()
    const b = Stream()
    const c = withLatestFrom ([ b ]) (a)
    b.end()

    t.false(c.end.get())

    t.end()
  })
})
