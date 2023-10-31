import { map } from './map.js'
import { unix_timestamp_ms } from './unix_timestamp_ms.js'

export const iso8601_datetime = map
	(x => new Date(x).toISOString())
	(unix_timestamp_ms)
