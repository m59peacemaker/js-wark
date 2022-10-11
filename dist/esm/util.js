const identity = x => x;

const noop = () => {};

const pipe2 = (f, g) => x => g(f(x));

const update = index => value => array => {
	const x = [];
	for (let i = 0; i < array.length; ++i) {
		x[i] = i === index ? value : array[i];
	}
	return x
};

export { identity, noop, pipe2, update };
