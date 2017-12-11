import { combine, immediate } from '../'

const merge = streams => immediate
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

export default merge
