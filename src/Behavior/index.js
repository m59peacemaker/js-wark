import * as Emitter from '../Emitter'
import { call } from '../utils'

const Behavior = sample => {
	return {
		sample
	}
}

const create = Behavior

const of = value => create(() => value)

const join = b => b.sample()

const flatMap = f => b => create(() => f(join(join(b))))

const map = f => b => flatMap (f) (of(b))

const lift = fn => behaviors => create(t => fn(behaviors.map(b => b.sample(t))))

const apply = bf => bv => lift (call) ([ bf, bv ])

// TODO: name `fn` better
const loop = fn => {
	const b = fn(create(t => b.sample(t)))
	return b
}

const hold = value => event => {
	event.subscribe(v => {
		value = v
	})
	return create(() => value)
}

const fold = reducer => initialValue => emitter => loop(behavior =>
	hold
		(initialValue)
		(Emitter.snapshot (reducer) (behavior) (emitter))
)

const bufferN = n => startEvery => emitter =>
	fold
		((buffer, v) => [ ...(buffer.length === Math.max(n, startEvery) ? buffer.slice(startEvery) : buffer), v ])
		([])
		(emitter)


export {
	create,
	bufferN,
	of,
	hold,
	fold,
	loop,
	map
}
