import { switch as Event_switch } from './switch.js'
import { wait } from './wait.js'

export const delay = ({ ms }) => Event_switch (value => wait ({ ms, value }))
