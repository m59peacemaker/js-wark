import { Dynamic } from '../Dynamic'

export declare function hold<A, B extends A> (initial_value: A): (updates: Event<B>) => Dynamic<A, B>
