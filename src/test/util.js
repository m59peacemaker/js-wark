// requires node --allow-natives-syntax
export const gc = async () => new Function("%CollectGarbage('all')")()

export const promise_wait = ms => new Promise(resolve => setTimeout(resolve, ms))
