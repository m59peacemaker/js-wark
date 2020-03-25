import { fromPromise } from './fromPromise.js'
import { switchMap } from './switchMap.js'

// occurs with the value of the latest promise received
export const awaitPromiseLatest = switchMap (fromPromise)
