import { call } from '../util'

const Behavior = f => {
	const cache = { t: Symbol(), value: null }
	return {
		sample: t => {
			cache.t === t || Object.assign(cache, { t, value: f(t) })
			return cache.value
		}
	}
}

export const create = Behavior

export const constant = value => create(() => value)

export const chain = f => b => create(t => f(b.sample(t)).sample(t))

export const lift = f => behaviors => create(t => f(...behaviors.map(b => b.sample(t))))

export const lift2 = f => a => b => lift (a => b => f (a) (b)) ([ a, b ])

export const apply = bf => bv => lift2 (call) ([ bf, bv ])

export const map = f => b => create(t => f(b.sample(t)))

export const createProxy = ({ pre_mirror_sample_error_message }) => {
	let sample = () => { throw new Error(pre_mirror_sample_error_message) }
	const mirror = behavior => {
		sample = behavior.sample
		return behavior
	}
	return { sample: t => sample(t), mirror }
}

export const proxy = () => createProxy({ pre_mirror_sample_error_message: 'Behavior proxy should not be sampled before being mirrored!' })
