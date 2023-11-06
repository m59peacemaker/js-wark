import { Event } from './Event'

export declare function tag<A> (sample: Sample<A>): (event: Event<unknown>) => Event<A>
