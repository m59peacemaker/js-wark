type T_release = () => void

const create = () => {
	let locked = false

	const queue : T_release[] = []

	const acquire = fn => {
		if (mutex.locked) {
			queue.push(fn)
			return
		}

		locked = true

		let released = false
		const release = () => {
			if (released) {
				return
			}
			released = true

			locked = false

			if (queue.length) {
				acquire(queue.shift())
			}
		}

		fn(release)
	}

	return { acquire, locked: () => locked }
}

export default create

export {
	create
}
