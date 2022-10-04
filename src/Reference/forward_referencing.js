import { construct } from './construct.js'

export const forward_referencing = f =>
	construct((assign, reference) => assign(f(reference)))
