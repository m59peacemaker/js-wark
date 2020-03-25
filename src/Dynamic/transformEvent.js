import { hold } from './hold.js'

export const transformEvent = f => dynamic => hold
	(dynamic.sample(dynamic.update.t()))
	(f(dynamic.update))
