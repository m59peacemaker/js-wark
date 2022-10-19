import { create as create_instant } from '../Instant/index.js'

export const get = sample => sample.perform(create_instant())
