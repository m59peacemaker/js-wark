import { updates } from '../Dynamic/updates.js';
import { gate } from './gate.js';
import { never } from './never.js';
import { take_until } from './take_until.js';

/*
	TODO: get opinions about this
		If the Dynamic's value is already `true`, the returned Event should be `never`.
		But checking the value is supposed to be Sample, a type of Action, so `Sample.run(dynamic)` is required in order to get that value.
		Is that problematic here?
		If there are any side effects of the run() call, they will be triggered here...
		Though, that is implied by the operator, and it is on the impure Event anyway, and it does have the Sample cache, so it's only going to happen once for this moment,
		so maybe it's coherent.
*/

/*
	Dynamic Boolean => Event X => Event X
	Takes a Dynamic Boolean, `a`, and an Event, `b`, and returns an Event with the same occurrences as Event `b`, until the value of Dynamic `a` is `true`, and completes when Dynamic `a` is true.
*/
const take_until_true = dynamic => event =>
	dynamic.run()
		?
			never
		:
			take_until
				(gate
					(dynamic)
					(updates (dynamic))
				)
				(event);

export { take_until_true };
