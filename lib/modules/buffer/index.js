import { map } from '../'

const buffer = notifier => source => {
  let bufferedValues = []

  map (v => bufferedValues.push(v)) (source)

  return map
    (() => {
      const values = [ ...bufferedValues ]
      bufferedValues = []
      return values
    })
    (notifier)
}

export default buffer
