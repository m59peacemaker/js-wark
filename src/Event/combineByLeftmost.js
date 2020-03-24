import { combineAllByLeftmost } from './combineAllByLeftmost'

export const combineByLeftmost = a => b => combineAllByLeftmost([ a, b ])
