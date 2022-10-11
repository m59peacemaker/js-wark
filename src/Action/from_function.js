import { construct } from './construct.js'

export const from_function = f => construct(() => f())
