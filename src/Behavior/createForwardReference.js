export const createForwardReference = ({ pre_assign_sample_error_message }) => {
	let sample = t => { throw new Error(pre_assign_sample_error_message) }
	const assign = behavior => {
		sample = behavior.sample
		return behavior
	}
	return { sample: t => sample(t), assign }
}
