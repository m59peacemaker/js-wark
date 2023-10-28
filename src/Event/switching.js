import { hold } from './hold.js'
import { switching as Dynamic_switching } from '../Dynamic/switching.js'
import { never } from './never.js'

export const switching = event => Dynamic_switching (hold (never) (event))
