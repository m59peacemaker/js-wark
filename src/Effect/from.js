import { construct } from './construct.js'

export const from = f => construct(() => f())
