import { Stream, endsOn } from '../'
import { map } from './'

const partitionArray = length => source => {
  const streams = [ ...new Array(length) ].map(() => endsOn([ source.end ]) (Stream()))
  map
    (array => array.forEach((v, idx) => streams[idx].set(v)))
    (source)
  return streams
}

export default partitionArray
