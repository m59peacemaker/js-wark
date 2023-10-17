import { get_value } from './get_value.js'

export const compute_cached_value = event => instant => get_value(instant, event)
