import { Event } from './Event'

export declare function filter<A> (predicate: (a: A) => boolean): (subject_event: Event<A>) => Event<A>
