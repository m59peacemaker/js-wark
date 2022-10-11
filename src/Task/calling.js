import { map as Action_map } from '../Action/map.js'
import { calling as Event_calling } from '../Event/calling.js'

export const calling = f => Action_map (Event_calling (f))
