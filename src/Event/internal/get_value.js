import { get_value_with_cache } from './get_value_with_cache.js'
import { _nothing } from './_nothing.js'

export const get_value = (instant, x) => {
	const cache = instant.cache.get(x)
	if (cache) {
		return get_value_with_cache(instant, cache, x)
	} else {
		return _nothing
	}
}
