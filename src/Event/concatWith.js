import { combineAllWith } from './combineAllWith.js'

export const concatWith = whenA => whenB => whenAB => a => b =>
	combineAllWith
		(o =>
			o.hasOwnProperty(0)
				? (o.hasOwnProperty(1)
						? whenAB (o[0]) (o[1])
						: whenA(o[0]))
				: whenB(o[1])
		)
		([ a, b ])
