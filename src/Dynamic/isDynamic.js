import { typeIdentifier } from './_type.js'

export const isDynamic = v => v && v.typeIdentifier === typeIdentifier
