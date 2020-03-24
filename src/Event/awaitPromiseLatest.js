import { switchMap } from './switchMap'
import { fromPromise } from './fromPromise'

// occurs with the value of the latest promise received
export const awaitPromiseLatest = switchMap (fromPromise)
