import { create } from './create.js'

export const lift = f => behaviors => create(t => f(...behaviors.map(b => b.sample(t))))
