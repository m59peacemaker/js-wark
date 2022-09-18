import { never } from './never.js'
import { switch as Event_switch } from './switch.js'

export const filter = f => event =>
	Event_switch
		(x => f (x) ? event : never)
		(event)
