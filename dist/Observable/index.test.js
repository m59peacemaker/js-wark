/* test('fromEmitter observable has initial value', t => { */
/* 	const e = Emitter.create() */
/* 	const o = Observable.fromEmitter ('foo') (e) */
/* 	t.equal(o.get(), 'foo') */
/* 	t.end() */
/* }) */
/* test('fromEmitter observable gets new value from emitter', t => { */
/* 	const e = Emitter.create() */
/* 	const o = Observable.fromEmitter ('foo') (e) */
/* 	t.equal(o.get(), 'foo') */
/* 	e.emit('bar') */
/* 	t.equal(o.get(), 'bar') */
/* 	e.emit('baz') */
/* 	t.equal(o.get(), 'baz') */
/* 	t.end() */
/* }) */
/* test('fromEmitter observable observer gets observable values', t => { */
/* 	const expected = [ 'foo', 'bar', 'baz' ] */
/* 	t.plan(expected.length) */
/* 	const e = Emitter.create() */
/* 	const o = Observable.fromEmitter ('foo') (e) */
/* 	o.observe(value => t.equal(value, expected.shift())) */
/* 	e.emit('bar') */
/* 	e.emit('baz') */
/* }) */
