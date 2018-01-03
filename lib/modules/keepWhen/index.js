import { filter } from '../'

const keepWhen = testStream => sourceStream => filter (_ => testStream.get()) (sourceStream)

export default keepWhen
