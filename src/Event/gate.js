import { filter } from './filter'

export const gate = behavior => event => filter (() => behavior.sample(event.t())) (event)
