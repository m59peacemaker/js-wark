import { switchMap } from './switchMap'
import { identity } from '../util'

export const switchLatest = switchMap (identity)
