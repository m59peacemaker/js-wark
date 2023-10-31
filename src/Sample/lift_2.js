export const lift_2 = f => x1 => x2 =>
	construct (instant =>
		f
			(x1.perform(instant))
			(x2.perform(instant))
	)
