import { create as create_instant } from '../Instant/create.js'

export const get = sample => sample.perform(create_instant())
