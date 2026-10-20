# Assumptions

These rules apply until a later stage documents a change.

- Time is measured in whole or fractional **days** from an implicit model origin of day 0.
- Supplier `reliability` is stored because the user entered it. The current product does not turn that number into a probability of extra delay.
- Inventory available quantity, once simulation exists, will be on-hand minus reserved quantity.
- Directed cycles are unsupported. Validation reports the cycle instead of approximating a result.
- A graph can be saved while invalid so work in progress is not lost. Simulation will require a valid graph.
- Sample seed data is labeled `(sample)` and uses `demo@ripple.local`. It is demonstration data, not a real business.
