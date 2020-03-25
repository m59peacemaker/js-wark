import { concatAll } from './concatAll.js'

export const concat = a => b => concatAll ([ a, b ])
