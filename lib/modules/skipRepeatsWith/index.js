import { immediate } from '../../'
import { map, reject, pairwise } from '../'

const skipRepeatsWith = predicate => stream =>
  map
    (([ a, b ]) => b)
    (reject
      (([ a, b ]) => predicate (a) (b))
      (immediate (pairwise (stream)))
    )

export default skipRepeatsWith
