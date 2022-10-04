import { Reference } from './Reference.js'

export const get = (dependant, x, f) => {
	if (x instanceof Reference) {
		x.get(dependant, f)
	} else {
		f (x)
	}
}
