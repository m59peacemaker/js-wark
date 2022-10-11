import { create_instant } from '../create_instant.js'
import { run_post_instant } from '../run_post_instant.js'

export const run = action => {
	const instant = create_instant()
	const result = action.run(instant)
	run_post_instant(instant)
	return result
}
