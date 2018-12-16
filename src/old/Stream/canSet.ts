const canSet = stream => {

	const set = value => {
		stream.initialized = true
		stream.value = value
	}

	return {
		set
	}
}

export default canSet
