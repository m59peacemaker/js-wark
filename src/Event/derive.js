import { create as Emitter_create, derive as Emitter_derive, switchMap as Emitter_switchMap } from '../Emitter/index.js'
import { assignEventMetaProperties } from './assignEventMetaProperties.js'

export const derive = dependencies_source => f => {
	const { emit, subscribe } = Emitter_create()
	let t = null
	let pending_t = null
	const dependencies_pending = new Set()
	const dependency_occurrences_now = new Map()
	const occur = v => {
		t = pending_t
		emit(v)
	}

	const dependency_occurrence_f = ({ value, index, dependency }) => {
		pending_t = dependency.t()
		dependency_occurrences_now.set(index, value)
	}

	const occurrence_pending_f = ({ value: isPending, index, dependency }, emit) => {
		dependencies_pending[isPending ? 'add' : 'delete'](index)
		if (dependencies_pending.size === 1) {
			emit(true)
		} else if (dependencies_pending.size === 0) {
			dependency_occurrences_now.size && f(occur, Object.fromEntries(dependency_occurrences_now), pending_t)
			dependency_occurrences_now.clear()
			pending_t = null
			emit(false)
		}
	}

	const combineDependencies = getEmitterForDependency => f => handleSwitch => {
		const combineArray = handle_derive => dependencies => Emitter_derive
			(dependencies.map(getEmitterForDependency))
			((emit, { index, value }) => handle_derive({ index, value, dependency: dependencies[index] }, emit))
		return Array.isArray(dependencies_source)
			? combineArray (f) (dependencies_source)
			: handleSwitch (f) (Emitter_switchMap (combineArray((data, emit) => emit(data))) (dependencies_source))
	}

	const occurrence_pending = combineDependencies
		(dependency => dependency.occurrence_pending)
		(occurrence_pending_f)
		(f => emitter => Emitter_derive ([ emitter ]) ((emit, { value }) => f(value, emit)))

	const dependency_occurrence = combineDependencies
		(dependency => dependency)
		(dependency_occurrence_f)
		(f => emitter => {
			emitter.subscribe(f)
			return emitter
		})

	return assignEventMetaProperties({
		t: () => t,
		occurrence_pending,
		subscribe
	})
}
