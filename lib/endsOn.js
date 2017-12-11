import { assertIsStream, assertIsArray } from './util/asserts'

const endsOn = streamsToEndOn => streamToEnd => {
  assertIsArray ('streamsToEndOn') (streamsToEndOn)
  assertIsStream ('streamToEnd') (streamToEnd)

  streamToEnd.end.stopDepending()
  streamsToEndOn.forEach(streamToEndOn => {
    streamToEnd.end.dependencies.add(streamToEndOn)
    streamToEndOn.registerDependant(streamToEnd.end)
  })
  return streamToEnd
}

export default endsOn
