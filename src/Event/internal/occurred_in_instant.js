import { get_value } from './get_value.js'
import { _nothing } from './_nothing.js'

export const occurred_in_instant = (instant, event) => get_value(instant, event) !== _nothing
