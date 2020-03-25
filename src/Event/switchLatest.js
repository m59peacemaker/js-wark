import { switchMap } from './switchMap.js'
import { identity } from '../util.js'

export const switchLatest = switchMap (identity)
