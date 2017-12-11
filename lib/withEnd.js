import withDependencies from './withDependencies'
import StreamBase from './StreamBase'
import decorate from './util/decorate'

const EndStream = stream => {
  const onPropagation = () => endStream()

  const endStream = withDependencies
    ({ onPropagation })
    (StreamBase({ initialized: false, initialValue: false }))

  const setDecorator = set =>
    () => {
      set(true)
      if (endStream.isPropagator) {
        stream.onEnd()
        endStream.onEnd()
      }
    }

  const onPropagationCompleteDecorator = onPropagationComplete =>
    () => {
      if (endStream.get()) {
        stream.onEnd()
        endStream.onEnd()
      }
    }

  return Object.assign(endStream, {
    onPropagationComplete: decorate
      (onPropagationCompleteDecorator)
      (endStream.onPropagationComplete),
    set: decorate (setDecorator) (endStream.set),
    end: endStream,
    type: 'end'
  })
}

const withEnd = stream => {
  return Object.assign(stream, {
    end: EndStream(stream)
  })
}

export default withEnd
