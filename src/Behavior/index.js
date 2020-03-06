import { call } from '../util'

const Behavior = f => {
	const cache = { time: Symbol(), value: null }
	return {
		sample: time => {
			cache.time === time || Object.assign(cache, { time, value: f() })
			return cache.value
		}
	}
}

export const create = Behavior

export const of = value => create(() => value)

export const chain = f => b => create(t => f(b.sample(t)).sample(t))

export const lift = f => behaviors => create(t => f(...behaviors.map(b => b.sample(t))))

export const lift2 = f => a => b => lift (f) ([ a, b ])

export const apply = bf => bv => lift (call) ([ bf, bv ])

export const map = f => b => create(t => f(b.sample(t)))

export const createProxy = ({ pre_mirror_sample_error_message }) => {
	let sample = () => { throw new Error(pre_mirror_sample_error_message) }
	const mirror = behavior => {
		sample = behavior.sample
		return behavior
	}
	return { sample: () => sample(), mirror }
}

export const proxy = () => create_proxy({ pre_mirror_sample_error_message: 'Behavior proxy should not be sampled before being mirrored!' })
