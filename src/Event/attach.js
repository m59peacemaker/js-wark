import { snapshot } from './snapshot.js'

export const attach = snapshot (x => y => [ y, x ])
