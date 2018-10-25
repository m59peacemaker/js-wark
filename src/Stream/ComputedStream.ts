import canGetSet from './canGetSet'
import canPropagate from './canPropagate'
import Emitter from 'better-emitter'
import { TYPE_STREAM } from '../constants'
import EndStream from './EndStream'
import assertStreamNotEnded from '../util/assertStreamNotEnded'

function ComputedStream (combineFn, dependencies) {

  let inPropagation = false
	let calledSetDuringThisPropagation = false
  let queuedValues = []

	const computedStream = value => {
		if (calledSetDuringThisPropagation) {
			queuedValues.push(value)
			return
		}
		if (inPropagation) {
	  	calledSetDuringThisPropagation = true
		}
		assertStreamNotEnded(computedStream)
		getterSetter.set(value)
		computedStream.propagate()
	}

	const compute = (updatedDependencies = []) => {
		return combineFn(computedStream, dependencies, updatedDependencies)
	}

	const maybeBecomeActive = () =>
		computedStream.active = computedStream.active || dependencies.every(dependency => dependency.initialized)

	const computeIfActive = (updatedDependencies) => {
		maybeBecomeActive()
		computedStream.active && compute(updatedDependencies)
	}

	const onPropagation = ({ updatedStreams }) => {
		inPropagation = true
		const updatedDependencies = dependencies.filter(
		  dependency => updatedStreams.includes(dependency)
		)
		if (updatedDependencies.length) {
			maybeBecomeActive()
			computeIfActive(updatedDependencies)
		}
	}

	const onPropagationComplete = () => {
		console.log(computedStream.label, 'onPropagationComplete()', queuedValues)
		inPropagation = false
		calledSetDuringThisPropagation = false
		queuedValues.forEach(value => computedStream(value))
		queuedValues = []
	}


	const getterSetter = canGetSet(computedStream)

	const end = EndStream()

	return Object.assign(
	  computedStream,
		getterSetter,
		canPropagate(Emitter(computedStream)),
		{
			compute,
			computeIfActive,
			onPropagation,
			onPropagationComplete,
			set: computedStream,
			end,
			// TODO: TYPE_COMPUTED_STREAM ?
			[Symbol.toStringTag]: TYPE_STREAM
		}
	)
}

export default ComputedStream
