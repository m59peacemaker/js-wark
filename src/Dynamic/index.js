// TODO: entertaining Dynamic.create() as similar to Event.create - makes a Dynamic whose .update is a source event, so you don't have to make an event and then hold it
// const a = Dynamic.create(0)
// a.sample() // 0
// a.update(10)
// a.sample() // 10
//export const create = Dynamic

/*export const of = (...values) => {
	const event = Event.of(...values)
	return Dynamic(event, hold (values[0]) (event))
}*/
// TODO: maybe rename this toEvent or something else less ambiguous... this sounds like it's a function that updates the dynamic
//export const update = dynamic => dynamic.update

// TODO: figure out the todos and make stuff better and document it, or ditch these, dunno yet
// TODO: maybe a pattern will emerge for creating functions that do `isDynamic(v) ? [ v ] : []` (in whatever generic/reusable way) Maybe something about monoids and empty, or just a wrapper around fold
// having a recentN transducer and a reduction for Event and a different one for Dynamic  would probably settle everything like this
/*export const recentN = n => v =>
	fold
		(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
		(isDynamic(v) ? [ v.sample() ] : [ ])
		(isDynamic(v) ? v.update : v) // TODO: yikes, these checks are annoying

export const bufferN = n => startEvery => v => // again with the awfulness
	filter
		(buffer => buffer.length === n)
		(fold
			(v => buffer => [ ...(buffer.length === Math.max(n, startEvery) ? buffer.slice(startEvery) : buffer), v ])
			(isDynamic(v) ? [ v.sample() ] : [ ])
			(isDynamic(v) ? v.update : v)
		)
export const pairwise = bufferN (2) (1)
*/

export * from './assemble.js'
export * from './chain.js'
export * from './constant.js'
export * from './filter.js'
export * from './fold.js'
export * from './forwardReference.js'
export * from './hold.js'
export * from './isDynamic.js'
export * from './lift.js'
export * from './lift2.js'
export * from './map.js'
export * from './onOff.js'
export * from './toggle.js'
export * from './transformBehavior.js'
export * from './transformEvent.js'
