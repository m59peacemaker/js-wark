import { Stream } from '../'
import { merge, map, switchLatest } from './'

const switchImmediate = streamOfStreams => merge([
  switchLatest(streamOfStreams),
  map (stream => stream.get()) (streamOfStreams)
])

export default switchImmediate
