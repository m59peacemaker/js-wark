import { derive } from './derive.js'

export const map = f => e => derive ([ e ]) ((occur, o) => occur(f(o[0])))
