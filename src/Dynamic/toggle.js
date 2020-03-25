import { fold } from './fold.js'

export const toggle = fold (() => v => !v)
