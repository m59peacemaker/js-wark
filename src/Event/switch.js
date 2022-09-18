import { switch_resolver_eager } from './switch_resolver_eager.js'
import { switch_with } from './switch_with.js'
import { never } from './never.js'

export const Event_switch = f => switch_with (switch_resolver_eager) (f) (never)

export { Event_switch as switch }
