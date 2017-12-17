import { combine, endsOn } from './'

const endsWhenAll = streamsToEndOn => streamToEnd => {
  const allStreamsEnded = combine
    ((_, self) => self.set(true))
    (streamsToEndOn)

  endsOn ([ streamToEnd.end ]) (allStreamsEnded)
  endsOn ([ allStreamsEnded ]) (streamToEnd)

  return streamToEnd
}

export default endsWhenAll
