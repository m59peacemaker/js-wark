import { scan } from './scan.js'

const incrementing = x => _ => x + 1

export const count = event => scan (incrementing) (0) (event)
