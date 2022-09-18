import { hold } from '../Event/hold.js'
import { exposed_producer } from '../Event/exposed_producer.js'

export const create = initial_value => hold (initial_value) (exposed_producer())
