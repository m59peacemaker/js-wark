import { combine, immediate, endsWhenAll } from '../../'

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

  endsWhenAll
    (streams.map(stream => stream.end))
    (merged)

  return merged
}

export default merge
