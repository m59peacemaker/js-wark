import extend from '../util/extend'

const canGetSet = stream => {

	const set = value => {
		stream.initialized = true
		stream.value = value
		// TODO: maybe just use ComputedStream.onSet or something
		stream.emit('set', stream.value)
	}

	const get = () => stream.value

	function toString () {
		return `${stream[Symbol.toStringTag]}(${stream.value})`
	}

  return {
		set,
		get,
		toJSON: get,
		toString
	}
}

export default canGetSet
