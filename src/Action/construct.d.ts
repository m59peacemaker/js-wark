import { Action } from './'

export declare function construct<A> (instant: (instant: Instant) => A) => Action<A>
