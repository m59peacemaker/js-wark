import { fold } from './fold'

export const toggle = fold (() => v => !v)
