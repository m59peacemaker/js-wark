import test from 'tape'
import { Stream, endsWhenAll } from '../'

test('endsWhenAll', t => {
  t.test('streamToEnd does not end when a single streamToEndOn emits', t => {
    const streamToEnd = Stream()
    const a = Stream()
    const b = Stream()
    endsWhenAll ([ a, b ]) (streamToEnd)
    a.set(1)

    t.false(streamToEnd.end.get())

    t.end()
  })

  t.test('streamToEnd ends once all streamsToEndOn have emitted', t => {
    const streamToEnd = Stream()
    const a = Stream()
    const b = Stream()
    endsWhenAll ([ a, b ]) (streamToEnd)
    a.set(1)
    b.set(1)

    t.true(streamToEnd.end.get())

    t.end()
  })
})
