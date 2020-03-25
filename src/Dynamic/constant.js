import { hold } from './hold.js'
import { never } from '../Event/never.js'

export const constant = value => hold (value) (never())
