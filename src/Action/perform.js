import { create as create_instant } from '../Instant/create.js'

export const perform = action => action.perform(create_instant())
