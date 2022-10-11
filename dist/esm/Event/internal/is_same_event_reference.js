const is_same_event_reference = (a, b) => (a.referenced || a) === (b.referenced || b);

export { is_same_event_reference };
