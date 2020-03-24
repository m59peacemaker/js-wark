import { derive } from './derive'

export const combineAllWith = f => events => derive (events) ((occur, o) => occur(f(o)))
