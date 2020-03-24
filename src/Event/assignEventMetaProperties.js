export const assignEventMetaProperties = event => Object.assign(event, {
	[Symbol.toStringTag]: 'Event'
})
