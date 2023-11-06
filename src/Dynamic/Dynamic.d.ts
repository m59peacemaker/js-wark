import { Sample } from '../Sample/Sample'

export type Dynamic<A, B extends A> = Sample<A> & { updates: Event<B> }
