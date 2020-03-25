import { create } from './create.js'

export const constant = value => create(() => value)
