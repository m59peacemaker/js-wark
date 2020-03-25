import { create } from './create.js'

export const map = f => b => create(t => f(b.sample(t)))
