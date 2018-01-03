import test from 'tape'
import { Stream } from '../../'
import { extractCollectionDeep } from '../'

test('extractCollectionDeep', t => {
  t.test('extracts streams from deep collection', t => {
    const nestedStream = Stream()
    t.deepEqual(
      extractCollectionDeep({
        foo: 123,
        bar: Stream(456),
        baz: Stream(789),
        qux: {
          foo: 1234,
          bar: Stream(5678),
          baz: Stream({
            stream: Stream(nestedStream)
          })
        },
        stream: Stream(nestedStream)
      }),
      {
        foo: 123,
        bar: 456,
        baz: 789,
        qux: {
          foo: 1234,
          bar: 5678,
          baz: {
            stream: undefined
          }
        },
        stream: undefined
      }
    )

    t.end()
  })
})
