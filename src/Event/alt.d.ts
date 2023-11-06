import { Event } from './Event'

export declare function alt<A, B> (y: Event<B>): (x: Event<A>) => Event<A | B>
