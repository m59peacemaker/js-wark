import test from 'tape'
import { Stream } from '../'
import { scan } from './'

test('scan', t => {
  t.test('uses initial value if source stream is not initialized', t => {
    const numbers = Stream()
    const sum = scan
      (sum => n => sum + n)
      (0)
      (numbers)

    t.equal(sum.get(), 0)

    t.end()
  })

  t.test('uses source stream value if source stream is initialized', t => {
    const numbers = Stream(10)
    const sum = scan
      (sum => n => sum + n)
      (0)
      (numbers)

    t.equal(sum.get(), 10)

    t.end()
  })

  t.test('accumulates', t => {
    const numbers = Stream()
    const sum = scan
      (sum => n => sum + n)
      (0)
      (numbers)

    numbers.set(3)
    numbers.set(2)
    numbers.set(4)
    numbers.set(10)

    t.equal(sum.get(), 19)

    t.end()
  })
})
