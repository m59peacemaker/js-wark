import { construct } from './construct.js'

export const of = x => construct (() => x)
