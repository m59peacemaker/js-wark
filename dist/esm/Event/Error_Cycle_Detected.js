class Error_Cycle_Detected extends Error {
  constructor (message) {
    super(`Event's occurrence depends on its own occurrence.${message ? ` ${message}` : ''}`);
  }
}

export { Error_Cycle_Detected };
