import { Event } from './Event'

export declare function complete_on<A> (complete_event: Event<unknown>): (subject_event: Event<A>) => Event<A>
