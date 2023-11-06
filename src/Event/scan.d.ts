import { Event } from './Event'

export declare function scan<A, B, C> (f: (event_value: C) => (accumulator: B) => B): (initial_value: A) => (event: Event<C>) => Dynamic<A, B>
