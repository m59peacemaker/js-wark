import { Stream, combine } from '../'
import { bufferCount } from './'

const pairwise = source => combine
  (([ source, buffer ], self) => {
    const previousValue = (buffer.get() || [])[0]
    self.set([ previousValue, source.get() ])
  })
  ([
    source,
    bufferCount (2) (1) (source)
  ])

export default pairwise
