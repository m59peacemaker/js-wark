import { Event } from './Event'

export declare function snapshot<A, B> (f: (a: A, b: B) => C): (sample: Sample<A>) => (event: Event<B>) => Event<C>
