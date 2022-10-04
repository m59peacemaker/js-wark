export const lift2 = f => x1 => x2 =>
	construct (time => f (x1.run(time)) (x2.run(time)))
