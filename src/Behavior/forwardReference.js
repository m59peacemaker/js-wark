import { createForwardReference } from './createForwardReference.js'

export const forwardReference = () => createForwardReference({ pre_assign_sample_error_message: 'Behavior forwardReference should not be sampled before being assigned!' })
