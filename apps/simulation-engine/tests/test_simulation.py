import copy

from fastapi.testclient import TestClient

from app.algorithms.simulate import simulate
from app.core.exceptions import SimulationError
from app.main import app
from app.schemas.simulation import GraphDependency, SimulateRequest
from tests.graphs import chain, edge, node, request_for, two_branches

client = TestClient(app)


def by_id(result, node_id: str):
    return next(item for item in result.nodes if item.nodeId == node_id)


def test_valid_model_can_be_simulated() -> None:
    result = simulate(request_for(chain(on_hand=0)))
    order = by_id(result.scenario, "o")
    assert result.status == "completed"
    assert order.shortageQuantity == 0
    assert order.delayDays == 0
    assert order.readyDay == 7


def test_supplier_delay_propagates_downstream() -> None:
    result = simulate(request_for(chain(on_hand=0), lead_time=19))
    inventory = by_id(result.scenario, "i")
    production = by_id(result.scenario, "p")
    order = by_id(result.scenario, "o")
    assert inventory.readyDay == 19
    assert production.startDay == 19
    assert production.readyDay == 21
    assert order.readyDay == 21
    assert order.delayDays == 11
    assert "deadline_violated" in order.constraints
    assert any(item.nodeId == "o" and item.impact == "indirect" for item in result.affectedNodes)
    order_path = next(path for path in result.causalPaths if path.nodeId == "o")
    assert order_path.pathNames[0] == "Supplier A"
    assert order_path.pathNames[-1] == "Order 42"


def test_unaffected_branch_stays_unaffected() -> None:
    request = SimulateRequest.model_validate(
        {
            "model": two_branches(),
            "modifications": [{"nodeId": "s1", "field": "leadTimeDays", "value": 30}],
            "horizonDays": 90,
        },
    )
    result = simulate(request)
    order_a = by_id(result.scenario, "o1")
    order_b = by_id(result.scenario, "o2")
    baseline_b = by_id(result.baseline, "o2")
    assert order_a.delayDays > 0
    assert order_b.delayDays == 0
    assert order_b.readyDay == baseline_b.readyDay
    assert all(item.nodeId != "o2" for item in result.affectedNodes)


def test_inventory_can_absorb_a_supply_delay() -> None:
    result = simulate(request_for(chain(on_hand=40), lead_time=19))
    production = by_id(result.scenario, "p")
    order = by_id(result.scenario, "o")
    supplier = by_id(result.scenario, "s")
    assert supplier.readyDay == 19
    assert production.startDay == 0
    assert production.readyDay == 2
    assert order.delayDays == 0
    assert order.shortageQuantity == 0
    assert all(item.nodeId != "o" for item in result.affectedNodes)


def test_inventory_shortage_is_detected() -> None:
    starved = copy.deepcopy(chain(on_hand=5))
    supplier = next(item for item in starved.nodes if item.id == "s")
    supplier.config["capacityPerDay"] = 0
    result = simulate(request_for(starved))
    inventory = by_id(result.scenario, "i")
    assert inventory.shortageQuantity == 35
    assert "inventory_shortage" in inventory.constraints
    production = by_id(result.scenario, "p")
    assert production.quantityAvailable < 40
    assert "input_shortage" in production.constraints


def test_production_capacity_is_enforced() -> None:
    result = simulate(request_for(chain(on_hand=100, output_quantity=100, capacity=25), lead_time=5))
    production = by_id(result.scenario, "p")
    order = by_id(result.scenario, "o")
    assert production.quantityAvailable == 25
    assert "production_capacity" in production.constraints
    assert order.shortageQuantity == 15
    assert "order_unfulfilled" in order.constraints


def test_customer_order_delay_is_calculated() -> None:
    result = simulate(request_for(chain(on_hand=0, due_day=6), lead_time=5))
    order = by_id(result.scenario, "o")
    assert order.readyDay == 7
    assert order.delayDays == 1


def test_cycles_are_rejected() -> None:
    model = chain(on_hand=0)
    model.dependencies.append(edge("cycle", "p", "i", 1, "production_input"))
    try:
        simulate(request_for(model))
        raise AssertionError("cycle should be rejected")
    except SimulationError as error:
        assert error.code == "cycle"
        assert "Line 1" in error.message


def test_invalid_node_config_is_rejected() -> None:
    model = chain(on_hand=0)
    supplier = next(item for item in model.nodes if item.id == "s")
    supplier.config.pop("leadTimeDays")
    try:
        simulate(request_for(model))
        raise AssertionError("invalid config should be rejected")
    except SimulationError as error:
        assert "leadTimeDays" in error.message


def test_modifications_do_not_mutate_the_baseline_model() -> None:
    model = chain(on_hand=0)
    original = copy.deepcopy(model)
    simulate(request_for(model, lead_time=19))
    supplier = next(item for item in model.nodes if item.id == "s")
    assert supplier.config["leadTimeDays"] == 5
    assert model.model_dump() == original.model_dump()


def test_deterministic_repeat() -> None:
    first = simulate(request_for(chain(on_hand=0), lead_time=19))
    second = simulate(request_for(chain(on_hand=0), lead_time=19))
    assert first.model_dump() == second.model_dump()


def test_http_simulate_round_trip() -> None:
    payload = request_for(chain(on_hand=0), lead_time=19).model_dump()
    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    body = response.json()
    order = next(item for item in body["scenario"]["nodes"] if item["nodeId"] == "o")
    assert order["delayDays"] == 11
