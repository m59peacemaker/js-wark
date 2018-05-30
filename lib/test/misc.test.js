import test from 'tape'
import { Stream, combine, map } from '../'

const add = a => b => a + b

test('mapping over externally created stream inside a map function', t => {
  const stream$ = Stream(0)

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
