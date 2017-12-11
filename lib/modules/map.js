import { combine } from '../'

const map = mappingFn => stream =>
  combine
    (([ stream ], self) => self.set(mappingFn(stream.get())))
    ([ stream ])

export default map
