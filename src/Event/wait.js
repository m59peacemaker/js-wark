import { create as create_instant } from '../Instant/create.js'
import { join_propagation } from '../Occurrences/internal/join_propagation.js'
import { register_finalizer } from '../lib/finalization.js'

export const wait  = ({ ms }) => {
	const propagation = new Set()
	let completed_value = false

	const occurrences = {
		compute: Symbol(),
		join_propagation: f => join_propagation(f, propagation),
	}

	const completed = {
		perform: () => completed_value,
		updates: {
			compute: Symbol(),
			join_propagation: occurrences.join_propagation
		}
	}

	const compute_ref = new WeakRef(occurrences.compute)
	const completion_compute_ref = new WeakRef(completed.updates.compute)

	const timeout = setTimeout(
		() => {
			const instant = create_instant()
			const compute = compute_ref.deref()
			const completion_compute = completion_compute_ref.deref()
			if (compute !== undefined) {
				instant.cache.set(compute, { compute_value: () => ms, value: ms })
			}
			if (completion_compute !== undefined) {
				instant.cache.set(completion_compute, { compute_value: () => true, value: true })
			}
			for (const f of propagation) {
				f(instant)
			}
			completed_value = true
			for (const f of instant.post_computations) {
				f()
			}
		},
		ms
	)

	const unregister_compute_finalizer = register_finalizer(
		occurrences.compute,
		() => {
			if (completion_compute_ref.deref() === undefined) {
				clearTimeout(timeout)
				unregister_completion_compute_finalizer()
			}
		}
	)

	const unregister_completion_compute_finalizer = register_finalizer(
		completed.updates.compute,
		() => {
			if (compute_ref.deref() === undefined) {
				clearTimeout(timeout)
				unregister_compute_finalizer()
			}
		}
	)

	return {
		occurrences,
		completed
	}
}
