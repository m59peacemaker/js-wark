import { derive } from './derive'

export const filter = f => e => derive ([ e ]) ((occur, o) => f(o[0]) && occur(o[0]))
