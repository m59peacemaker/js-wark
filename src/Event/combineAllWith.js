import { derive } from './derive.js'

export const combineAllWith = f => events => derive (events) ((occur, o) => occur(f(o)))
