const Lift_3 = construct => f => x1 => x2 => x3 =>
	construct (instant =>
		f
			(x1.perform(instant))
			(x2.perform(instant))
			(x3.perform(instant))
	);

export { Lift_3 };
