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
a.subscribe(a => console.log({ a }))
b.subscribe(b => console.log({ b }))
d.subscribe(d => console.log({ d }))
//console.log(c.sample())
time.start()
console.log(c.sample())
//const countFolds = Behavior.fold (add) (b)
//const count = Behavior.sample()
