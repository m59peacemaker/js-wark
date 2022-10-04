import { _use } from '../Reference/use.js'

export const updates = dynamic =>
	_use(dynamic, dynamic => dynamic.updates)
