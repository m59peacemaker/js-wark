import { Reference } from './Reference.js'
import { construct } from './construct.js'

// slightly more efficient than `use (f) (x)`
export const _use = (x, f) => {
	if (x instanceof Reference) {
		return construct ((assign, reference) => x.get(reference, x => assign (f (x))))
	} else {
		return f (x)
	}
}

export const use = f => x => _use (x, f)
