import { get } from './get.js'

export const _call = (x, f) => get(null, x, f)

export const call = f => x => _call (x, f)
