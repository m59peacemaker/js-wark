import StreamBase from './StreamBase'
import withEnd from './withEnd'

const Stream = function (initialValue) {
  const base = StreamBase ({
    initialized: arguments.length !== 0,
    initialValue
  })
  const stream = withEnd (base)
  return Object.assign(stream, {
    type: 'static'
  })
}

export default Stream
