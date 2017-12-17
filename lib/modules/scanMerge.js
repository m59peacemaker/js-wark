import { combine, immediate, endsWhenAll } from '../'

const scanMerge = subjects => initialValue => {
  subjects = subjects.map(subject => Array.isArray(subject) ? subject : [ subject ])
  const streams = subjects.map(([ stream ]) => stream)

  const newStream = immediate
    (combine
      ((streams, self, changed) => {
        const newValue = subjects
          .filter(([ stream ]) =>
            self.initialized
            ? changed.includes(stream)
            : stream.initialized
          )
          .reduce(
            (acc, [ stream, reducer ]) => {
              return reducer
                ? reducer (acc) (stream.get())
                : stream.get()
            },
            self.initialized ? self.get() : initialValue
          )
        self.set(newValue)
      })
      (streams)
    )

  endsWhenAll
    (streams.map(stream => stream.end))
    (newStream)

  return newStream
}

export default scanMerge
