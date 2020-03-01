import * as Emitter from '../Emitter'
import * as Event from '../Event'
import { call, noop } from '../utils'
import { Always } from '../Time'

const Behavior = (time, f) => {
	const cache = { t: null, value: null }
	return {
		time,
		sample: () => {
			const t = time.current()
			cache.t === t || Object.assign(cache, { t, value: f() })
			return cache.value
		}
	}
}

const DiscreteBehavior = (value, update) => {
	update.subscribe(v => value = v)
	return {
		...Behavior(cacheBustingTime, () => value),
		time: update.time,
		update
	}
}

const create = Behavior

const cacheBustingTime = (n => ({ current: () => ++n, forward: noop }))(0)

const findTime = behaviors => (behaviors.find(b => b.time !== Always) || behaviors[0]).time

const of = value => create(Always, () => value)

const join = b => b.sample()

const map = f => b => create(b.time, () => f(b.sample()))

const chain = f => b => create(b.time, () => join(f(b.sample())))

const lift = f => behaviors => create(findTime(behaviors), () => f(...behaviors.map(b => b.sample())))

const apply = bf => bv => lift (call) ([ bf, bv ])

const duplicateMirror = () => {
	throw new Error('Behavior proxy is already mirrored!')
}
const proxySample = () => {
	throw new Error('Behavior proxy should not be sampled before being mirrored!')
}
function BehaviorProxy () {
	let b = create(Always, proxySample)
	const updateProxy = Event.AtemporalEvent()
	const mirror = behavior => {
		const { update, sample } = behavior
		if (update) {
			update.subscribe(v => console.log({ v }) || updateProxy.emit(v))
		}
		Object.assign(b, { sample, mirror: duplicateMirror })
		return behavior
	}
	return Object.assign(b, { mirror, update: updateProxy })
}

const loop = time => fn => {
	const b = fn(create(time, () => b.sample()))
	return b
}

const hold = value => event => DiscreteBehavior(value, event)

// const fold = reducer => initialValue => event => {
// 	const proxy = BehaviorProxy()

// 	return proxy.mirror(
// 		hold
// 			(initialValue)
// 			(Event.snapshot (reducer) (proxy) (event))
// 	)
// }
const fold = reducer => initialValue => event => loop
	(event.time)
	(behavior =>
		hold
			(initialValue)
			(Event.snapshot (reducer) (behavior) (event))
	)

const bufferN = n => startEvery => event =>
	fold
		((buffer, v) => [ ...(buffer.length === Math.max(n, startEvery) ? buffer.slice(startEvery) : buffer), v ])
		([])
		(event)

export {
	BehaviorProxy,
	create,
	bufferN,
	feedback,
	fold,
	hold,
	lift,
	loop,
	map,
	of
}

/* for docs:

on Behavior vs IO, what is a behavior
const click = Event()
const random = Behavior.create(Math.random)
const randWhenClickedA = Event.tag (random) (click)
const rameWhenClickedB = Event.tag (random) (click)

// not positive this idea will be used, but it is super cool
// Behavior(Behavior) means all the behaviors that could be derived from the expression
// Behavior(Behavior) means all the accumulations that could be derived from the expression / that could possibly come about to be due to the expression
// an accumulation of [ 1, 2, 3, 4, 5 ] if you sampled it at the time of 1, or an accumulation of [ 4, 5 ] if you sampled at the time of 4, etc
// the outer behavior represents the inner changing behavior, so sampling the outer one gives you one specific accumulation behavior out of the many possible behaviors
*/
