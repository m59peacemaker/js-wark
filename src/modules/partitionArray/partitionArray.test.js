import test from 'tape'
import { Stream, isStream } from '../../'
import { partitionArray } from '../'

test('partitionArray', t => {
  t.test('returns array of `length` streams', t => {
    const source = Stream()
    t.equal((partitionArray (0) (source)).length, 0)
    t.equal((partitionArray (1) (source)).length, 1)
    t.equal((partitionArray (3) (source)).length, 3)
    ;(partitionArray (3) (source)).forEach(stream => t.true(isStream(stream)))

    t.end()
  })

  t.test('partition streams emit corresponding values from source array', t => {
    const source = Stream()
    const [ a, b ] = partitionArray (2) (source)

    source.set([ 1, 2 ])

    t.equal(a.get(), 1)
    t.equal(b.get(), 2)

    source.set([ 3, 4 ])

    t.equal(a.get(), 3)
    t.equal(b.get(), 4)

    t.end()
  })

  t.test('partition streams end with source streams', t => {
    const source = Stream()
    const partitions = (partitionArray (3) (source))

    source.end()

    partitions.forEach(stream => t.true(stream.end.get()))

    t.end()
  })
})
