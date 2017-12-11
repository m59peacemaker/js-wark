import { assertStreamIsType } from './util/asserts'

const immediate = stream => {
  assertStreamIsType ('computed', stream)
  stream.activate()
  stream.recompute()
  return stream
}

export default immediate
