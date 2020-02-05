import { TYPE_STREAM, TYPE_END_STREAM } from './constants'

const isStream = value => value
	&& (
		value[Symbol.toStringTag] === TYPE_STREAM
		|| value[Symbol.toStringTag] === TYPE_END_STREAM
	)

export default isStream
