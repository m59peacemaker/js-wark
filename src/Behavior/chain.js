import { create } from './create.js'

export const chain = f => b => create(t => f(b.sample(t)).sample(t))
