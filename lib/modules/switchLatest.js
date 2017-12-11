import { combine, map, defer, endsOn } from '../'

const switchLatest = streamOfStreams => combine
  (([ streamOfStreams ], self) => {
    const innerStream = streamOfStreams.get()
    const forwarder = map (self.set) (defer(innerStream))
    endsOn ([ streamOfStreams, streamOfStreams.end, innerStream.end ]) (forwarder)
  })
  ([ streamOfStreams ])

export default switchLatest
