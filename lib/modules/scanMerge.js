import { combine, immediate, endsOn } from '../'

const scanMerge = streamsWithReducers => initialValue => {
  const streams = streamsWithReducers.map(([ stream ]) => stream)

  const newStream = immediate
    (combine
      ((streams, self, changed) => {
        const newValue = streamsWithReducers
          .filter(([ stream ]) =>
            self.initialized
            ? changed.includes(stream)
            : stream.initialized
          )
          .reduce(
            (acc, [ stream, reducer ]) => {
              return reducer
                ? reducer (acc) (stream.get())
                : acc
            },
            self.initialized ? self.get() : initialValue
          )
        self.set(newValue)
      })
      (streams)
    )

  const endStreams = streams.map(stream => stream.end)
  const allStreamsEnded = combine
    ((_, self) => self.set(true))
    (endStreams)

  endsOn ([ allStreamsEnded ]) (allStreamsEnded)
  endsOn ([ allStreamsEnded ]) (newStream)

  return newStream
}

export default scanMerge
