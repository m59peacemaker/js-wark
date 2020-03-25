import { test } from 'zora'
import { pipe } from './util.js'

test('pipe', t => {
	t.equal(
		pipe ([ v => v + 1, v => v * 2 ]) (1),
		4
	)
	t.equal(
		pipe ([ v => v ]) (0),
		0
	)
})
