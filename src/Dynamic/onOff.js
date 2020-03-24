import { hold } from './'
import { concatAll, constant } from '../Event'

export const onOff = initialState => onEvent => offEvent => hold
	(initialState)
	(concatAll ([ constant (true) (onEvent), constant (false) (offEvent) ]))
