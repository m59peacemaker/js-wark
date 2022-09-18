export class Error_Cycle_Detected extends Error {
  constructor () {
    super(`Cycle detected. Event's occurrence depends on its own occurrence.`)
  }
}
