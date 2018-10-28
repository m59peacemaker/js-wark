# DESIGN

Propagation is not a stream informing dependants of the change, that then inform dependants of the change, and so on. Propagation is mapping one source value/change to one graph state.
Therefore, changes are propagated directly from the source stream introducing the change to all graph members.

## when to gather and sort dependants

Streams must propagate changes to dependants. To do so, dependants are deeply iterated to gather a flat list of streams within the stream's dependant tree, and then that list of dependants is topologically sorted.

Performing this work every time a stream changes, in the process of propagating the change, is a lot of redundant work that should be a big performance hit.

Performing this work every time there is a change in the tree of dependants is also redundant.
When combining streams into a new stream, each dependency will have a changed dependant and would collect dependants and sort them, but only once, of course.
The problem would be having multiple combines using the same dependency(ies).
The gather/sort would occur for each, even though it may be just a waste of effort but for the last change.

Instead, changes to the tree of dependants set a flag, and when the stream changes, before propagating, if the flag is set, the gather/sort will occur. So the gather/sort is lazy. This is the middle ground between the two previous options. The performance cost will be paid on the first `set` for the stream, which is also often when the stream has just been created.

## Stream

Could also be referred to as `SourceStream`
a container for a value that you can get and set
when it is set, it causes its dependencies to be computed in topological order

## ComputedStream

a stream with a computeFn and dependencies that are streams
the computeFn may or may not cause the computed stream to update
it is only the computation from its dependencies, its only responsibility
it can let dependences know it depends on them
it can compute
it should not be settable
it should have nothing to do with the propagation process

ComputedStream (computation)
computedStream.dependsOn
computedstream.endsOn
