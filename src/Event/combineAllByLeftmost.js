import { combineAllWith } from './combineAllWith.js'

export const combineAllByLeftmost = combineAllWith (o => Object.values(o)[0])
