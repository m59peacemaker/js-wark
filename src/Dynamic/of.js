import { never } from '../Event/never.js'

export const of = value => ({ run: () => value, updates: never })
