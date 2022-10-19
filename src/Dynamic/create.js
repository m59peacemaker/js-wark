import { hold } from '../Event/hold.js'
import { create as create_event } from '../Event/create.js'

export const create = initial_value => hold (initial_value) (create_event())
