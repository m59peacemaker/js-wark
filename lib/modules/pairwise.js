import { Stream, combine } from '../'

const pairwise = source => {
  let ready = false
  let previousValue

  return combine
    (([ source ], self) => {
      if (ready) {
        self.set([ previousValue, source.get() ])
      }

      ready = true
      previousValue = source.get()
    })
    ([ source ])
}

export default pairwise
