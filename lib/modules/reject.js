import { filter } from './'

const reject = predicate => stream => filter (v => !predicate(v)) (stream)

export default reject
