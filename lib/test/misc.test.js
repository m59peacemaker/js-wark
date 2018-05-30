import test from 'tape'
import { Stream, combine, map } from '../'

const add = a => b => a + b
const stream$ = Stream(0)

test('mapping over externally created stream inside a map function', t => {
  map
    (() => t.equal(
      map
        (add(3))
        (map
          (add(5))
          (stream$)
        )
        .get(),
      8
    ))
    (Stream(1))

  t.end()
})
