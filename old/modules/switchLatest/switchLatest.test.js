import test from 'tape'
import { Stream, combine } from '../../'
import { map, switchLatest } from '../'


test('switchLatest', t => {
  t.test('emits only when inner stream emits', t => {
    const a = Stream()
    const b = Stream()
    const aOrB = Stream()
    const d = switchLatest(aOrB)

    t.equal(d.get(), undefined)

    aOrB.set(a)

    t.equal(d.get(), undefined)

    aOrB.set(b)

    t.equal(d.get(), undefined)

    b.set(10)

    t.equal(d.get(), 10)

    aOrB.set(a)

    t.equal(d.get(), 10)

    b.set(20)

    t.equal(d.get(), 10)

    a.set(5)

    t.equal(d.get(), 5)

    b.set(1)

    aOrB.set(b)

    t.equal(d.get(), 5)

    t.end()
  })

  t.test('ends when streamOfStreams ends', t => {
    const a = Stream()
    const streamOfStreams = Stream(a)
    const c = switchLatest(streamOfStreams)

    a.set(10)
    streamOfStreams.end()

    t.equal(c.get(), 10)
    t.true(c.end.get())

    a.set(20)

    t.equal(c.get(), 10)

    t.end()
  })

  t.test('does not end when inner stream ends', t => {
    const a = Stream()
    const b = Stream(1)
    const streamOfStreams = Stream(a)
    const c = switchLatest(streamOfStreams)

    a.set(10)

    t.equal(c.get(), 10)

    a.end()

    t.false(c.end.get())

    streamOfStreams.set(b)

    t.equal(c.get(), 10)

    b.set(20)

    t.equal(c.get(), 20)

    t.end()
  })
})
