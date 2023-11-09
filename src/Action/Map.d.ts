import { construct } from './construct'
import { Functor } from '../typeclass/Functor'

// TODO: should this moved to Functor.d.ts?
export declare function Map <A, B>(construct: Construct<B>) => Functor<A>['map']
