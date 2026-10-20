# Simulation design

The Python engine is deterministic. It does not sample probabilities and does not call an LLM.

## Time

All times are days from a model origin of day 0. A supplier with `leadTimeDays = 5` first becomes available on day 5.

## Algorithm

1. Validate the graph. Cycles and incomplete typed configuration are rejected.
2. Deep-copy the model. Scenario modifications are applied only to the copy.
3. Build a NetworkX DAG and process nodes in topological order.
4. Each node produces timed quantity batches. Downstream edges receive those batches in stable edge-id order.
5. Inventory available stock is on-hand minus reserved. That stock is available on day 0 and can absorb a later replenishment delay.
6. Production starts at the maximum ready day of required inbound quantities, then adds `durationDays`. Output cannot exceed `capacityPerPeriod`.
7. An order is delayed when fulfillment day is after `dueDay`. Unfulfilled quantity is a shortage, not an invented arrival time.
8. Baseline and scenario runs are compared. A node is affected only if a calculated field changed.

## Costs

Direct cost is `unitCost × quantity` for nodes that model a unit cost. Revenue at risk is the modeled revenue of delayed or short orders. It is labeled as an estimate, not a guaranteed loss.

Supplier `reliability` is ignored during calculation.

## Persistence

NestJS stores the model snapshot with each completed run. Later edits to the live graph do not change a stored result. If the engine returns an error, no simulation row is written and the model tables are left untouched.
