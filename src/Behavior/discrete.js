export const discrete = value => update => {
	update.subscribe(v => value = v)
	return {
		sample: () => value
	}
}
