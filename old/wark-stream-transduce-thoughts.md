transduce is based on reducing:
  step / transformation
  builder

transducing a stream would mean
  stepping over the stream, applying a transformation to each step
  building a new stream from the result of each step

What is a stream step?
that's when the value changes?

value changes -> apply transformation, build (self.set)

this sounds like Stream.map()
