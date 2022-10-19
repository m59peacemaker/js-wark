export const promise_wait = ({ ms }) =>
	new Promise(resolve => setTimeout(() => resolve(ms), ms))
