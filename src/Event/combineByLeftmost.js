import { combineAllByLeftmost } from './combineAllByLeftmost.js'

export const combineByLeftmost = a => b => combineAllByLeftmost([ a, b ])
