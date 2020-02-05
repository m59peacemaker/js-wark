import { filter, reject } from '../'

const partition = pred => stream =>
  [ filter, reject ].map(fn => fn(pred) (stream))

export default partition
