import { hold } from './hold.js'
import { concatAll } from '../Event/concatAll.js'
import { constant } from '../Event/constant.js'

export const onOff = initialState => onEvent => offEvent => hold
	(initialState)
	(concatAll ([ constant (true) (onEvent), constant (false) (offEvent) ]))
