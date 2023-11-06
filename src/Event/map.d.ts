import { Event } from './Event'

export declare function map<A, B> (f: (x: A) => B, x: Event<A>): Event<B>
