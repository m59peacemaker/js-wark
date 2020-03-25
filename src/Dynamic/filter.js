import { transformEvent } from './transformEvent.js'
import { filter as Event_filter } from '../Event/filter.js'

export const filter = f => transformEvent (Event_filter (f))
