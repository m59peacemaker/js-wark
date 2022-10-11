import { map } from './map.js'
import { unix_timestamp } from './unix_timestamp.js'

export const iso8601_timestamp = map (x => new Date(x).toISOString()) (unix_timestamp)
