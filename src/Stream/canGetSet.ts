const canGetSet = stream => {

	const set = value => {
		stream.initialized = true
		stream.value = value
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
