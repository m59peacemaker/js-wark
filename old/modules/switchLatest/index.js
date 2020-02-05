import { combine, map, defer, endsOn } from '../../'

const switchLatest = streamOfStreams => combine
	(([ streamOfStreams ], self) => {
		const innerStream = streamOfStreams.get()
		const forwarder = map (self.set) (defer(innerStream))
		endsOn ([ streamOfStreams, streamOfStreams.end, innerStream.end ]) (forwarder)
	})
	([ streamOfStreams ])

const switchLatest = streamOfStreams => {
	const forwarder = ComputedStream([ v ] => v)
	map
		(innerStream => forwarder.dependsOn(defer(innerStream)))
		(streamOfStreams)
	forwarder.endsOn([ streamOfStreams.end ])
	return forwarder
}

export default switchLatest
