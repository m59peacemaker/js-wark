import { Functor } from './Functor'

export interface Applicative<A> extends Functor<A> {
	apply<B> (f: Applicative<(x: A) => B>): (x: Applicative<A>) => Applicative<B>
	of (x: A): Applicative<A>
}
