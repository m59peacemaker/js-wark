import { immediately } from '../immediately.js'
import { never_occurs } from './never_occurs.js'
import { switch_updating } from './switch_updating.js'

export const switching = switch_updating (immediately) (never_occurs)
