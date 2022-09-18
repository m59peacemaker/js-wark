export const lift_2 = f => x1 => x2 =>
	create (time => f (x1.run(time)) (x2.run(time)))
