import { construct } from './construct.js'

export const of = value => construct (assign => assign(value))
