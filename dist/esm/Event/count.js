import { scan } from './scan.js';

const incrementing = x => _ => x + 1;

const count = scan (incrementing) (0);

export { count };
