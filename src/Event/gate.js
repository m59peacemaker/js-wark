import { filter } from './filter.js'

export const gate = behavior => event => filter (() => behavior.sample(event.t())) (event)
