const canGet = stream => {

	const get = () => stream.value

	function toString () {
		return `${stream[Symbol.toStringTag]}(${stream.value})`
	}

	return {
		get,
		toJSON: get,
		toString
	}
}

export default canGet
