import { no_more_occurrences } from './internal/no_more_occurrences.js'
import { completed } from './completed.js'

export const _never = ({
	completion: completed,
	occurrences: no_more_occurrences (false)
})

export const never = no_more_occurrences (false)
