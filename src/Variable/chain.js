import { join } from './join.js'
import { map } from './map.js'

export const chain = f => x => {
	const [ a, _a ] = map (f) (x)
	const [ b, _b ] = join(a)
	return [ b, () => { _a(); _b() } ]
}
