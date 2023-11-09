import { create } from '../Instant/create.js';

const perform = action => action.perform(create());

export { perform };
