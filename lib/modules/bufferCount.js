import { scan, filter } from '../'

const bufferCount = size => startEvery => source => {
  const maxBufferLength = Math.max(size, startEvery)
  return filter
    (buffer => buffer.length === size)
    (scan
      (buffer => v => {
        buffer = buffer.length === maxBufferLength
          ? buffer.slice(startEvery)
          : buffer
        return buffer.concat([ v ])
      })
      ([])
      (source)
    )
}

export default bufferCount
