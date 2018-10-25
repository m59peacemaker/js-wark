import { isStream } from '../'

const assertStreamNotEnded = stream => {
  if (stream.end.get()) {
    throw new Error(`invalid operation attempted on ended stream ${stream}`)
  }
}

const assertStreamIsType = type => stream => {
  if (stream.type !== type) {
    throw new Error(`stream should be of type ${type}, but ${stream.type} given.`)
  }
}

const assertIsArray = label => value => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} should be an array. ${stream} given.`)
  }
}

const assertIsStream = label => value => {
  if (!isStream(value)) {
    throw new Error(`${label} should be a stream. ${typeof value} given.`)
  }
}

export {
  assertStreamNotEnded,
  assertStreamIsType,
  assertIsStream,
  assertIsArray
}
