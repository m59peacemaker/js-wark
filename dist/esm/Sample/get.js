import { create } from '../Instant/create.js';

const get = sample => sample.perform(create());

export { get };
