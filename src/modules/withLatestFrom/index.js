import { map } from '../'

const withLatestFrom = streams => stream =>
  map
    (v => [ v, ...streams.map(v => v.get()) ])
    (stream)

export default withLatestFrom
