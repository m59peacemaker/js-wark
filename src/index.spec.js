import * as Event from './Event'
import * as Behavior from './Behavior'
import { Time } from './Time'
import { add } from './utils'

// const Now = runnable => ({
// 	run: runnable.run
// })

// Now.chain = f => now => ({
// 	run: (...args) => {
// 		const n = f(now)
// 		now.run(...args)
// 		return n.run(...args)
// 	}
// })
//
//
const time = Time()
const a = Event.of (time) (1, 2, 3)
const b = Event.map (add(1)) (a)
const c = Behavior.fold (add) (0) (b)
//const c = Behavior.hold (0) (b)
const d = Event.tag (c) (b)
a.subscribe(a => console.log({ a, c: c.sample() }))
b.subscribe(b => console.log({ b, c: c.sample() }))
d.subscribe(d => console.log({ d, c: c.sample() }))
console.log({ c: c.sample() })
time.start()
console.log({ c: c.sample() })
