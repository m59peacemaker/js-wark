import { combineAllWith } from './combineAllWith'

export const combineAllByLeftmost = combineAllWith (o => Object.values(o)[0])
