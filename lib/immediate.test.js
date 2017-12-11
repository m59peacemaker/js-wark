import test from 'tape'
import { Stream, combine, immediate } from '../'

test('immediate', t => {
  t.test(
    'immediate(stream) calls a dependant stream body even though dependencies are not ready',
    t => {
      t.plan(1)
      immediate (combine (([ a ]) => t.false(a.initialized)) ([ Stream() ]))

      t.end()
    }
  )
})
