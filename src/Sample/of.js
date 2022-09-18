import { create } from './create.js'

export const of = x => create(() => x)
