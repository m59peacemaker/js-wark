import { assertStreamIsType } from './util/asserts'

/* TODO: test that calling immediate doesn't cause double compute
  Now fixed, but did have bug where `recompute` was always called, even if already active
*/
/*
  TODO: probably just use `activate` instead of `immediate`. `immediate` seems like it is just hiding the detail of how it works in a way that makes it harder to reason about usage.
  inactive: when dependencies aren't ready
  active: when dependencies are ready
  activate: make active even if dependencies aren't ready
*/
const immediate = stream => {
  assertStreamIsType ('computed', stream)
  stream.activate()
  return stream
}

export default immediate
