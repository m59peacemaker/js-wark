import { Applicative } from './Applicative'

export interface Monad<A> extends Applicative<A> {
	chain<B> (f: (x: A) => Monad<B>): (x: Monad<A>) => Monad<B>
	join<B> (x: Monad<Monad<A>>) => Monad<A>
}
