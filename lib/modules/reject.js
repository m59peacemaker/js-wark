import { combine } from '../'

const filter = predicate => stream => combine
  (([ stream ], self) => {
    if (!predicate(stream.get())) {
      self.set(stream.get())
    }
  })
  ([ stream ])

export default filter
