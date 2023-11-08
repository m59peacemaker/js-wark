export interface Functor<A> {
	map<B> (f: (x: A) => B): (x: A) => Functor<B>
}
