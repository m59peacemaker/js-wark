import { _use } from '../Reference/use.js';

const complete = event => _use(event, event => event.complete);

export { complete };
