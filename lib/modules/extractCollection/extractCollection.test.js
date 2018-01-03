import test from 'tape'
import { Stream } from '../../'
import { extractCollection } from '../'

test('extractCollection', t => {
  t.test(
    'takes object with stream values and non-stream values and returns object with non-stream values and stream values extracted',
    t => {
      const nestedStream = Stream()
      t.deepEqual(
        extractCollection({
          foo: 123,
          bar: Stream(456),
          baz: Stream(789),
          qux: 10,
          stream: Stream(nestedStream)
        }),
        {
          foo: 123,
          bar: 456,
          baz: 789,
          qux: 10,
          stream: nestedStream
        }
      )

      t.end()
    }
  )
})
