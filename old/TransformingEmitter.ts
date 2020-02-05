import Emitter from './index'

const create = transducer => {
	const emitter = Emitter.create()
	const input = value => {
		emitter.emit(foo(value))
	}

	emitter.input = input

	return emitter
}
