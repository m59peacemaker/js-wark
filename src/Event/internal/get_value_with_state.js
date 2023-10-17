export const get_value_with_state = (instant, state, x) => {
	if (state.computed === false) {
		state.computed = true
		state.value = x.compute(instant)
	}
	return state.value
}
