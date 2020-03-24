import { derive } from './derive'

export const map = f => e => derive ([ e ]) ((occur, o) => occur(f(o[0])))
