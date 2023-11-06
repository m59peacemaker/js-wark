import { Event } from './Event'

export declare function calling<A, B> (f: (a: A) => B): (x: Event<A>) => Event<B>
