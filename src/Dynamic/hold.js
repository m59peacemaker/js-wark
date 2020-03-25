import { discrete } from '../Behavior/discrete.js'
import { assemble } from './assemble.js'

export const hold = value => event => assemble
	(discrete (value) (event))
	(event)
