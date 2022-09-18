export const call = f => x => f(x)

export const identity = x => x

export const noop = () => {}

export const pipe2 = (f, g) => x => g(f(x))

export const update = index => value => array => {
	const x = []
	for (let i = 0; i < array.length; ++i) {
		x[i] = i === index ? value : array[i]
	}
	return x
}
