import { combine, immediate, endsOn } from '../'

const merge = streams => {
  const merged = immediate
    (combine
      ((dependencies, self, [ firstChange ]) => {
        if (firstChange) {
          self.set(firstChange.get())
        } else {
          const firstInitializedDependency = dependencies.find(v => v.initialized)
          if (firstInitializedDependency) {
            self.set(firstInitializedDependency.get())
          }
        }
      })
      (streams)
    )

  const endStreams = streams.map(stream => stream.end)
  const allStreamsEnded = combine
    ((_, self) => self.set(true))
    (endStreams)

  endsOn ([ allStreamsEnded ]) (allStreamsEnded)
  endsOn ([ allStreamsEnded ]) (merged)

  return merged
}

export default merge
