import { typeName, typeIdentifier } from './_type.js'

export const assemble = behavior => update => ({
	...behavior,
	update,
	subscribe: f => {
		f(behavior.sample(update.t()))
		return update.subscribe(f)
	},
	typeIdentifier,
	[Symbol.toStringTag]: typeName
})
