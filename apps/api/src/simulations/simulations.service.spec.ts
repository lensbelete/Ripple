import { BadRequestException, NotFoundException } from "@nestjs/common";
import { defaultNodeConfig } from "@ripple/shared-types";
import { SimulationsService } from "./simulations.service";

describe("SimulationsService", () => {
  const runs = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const models = {
    getOwnedModel: jest.fn(),
    getGraph: jest.fn(),
  };
  const engine = {
    simulate: jest.fn(),
  };
  const audit = {
    record: jest.fn(),
  };

  let service: SimulationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SimulationsService(runs as never, models as never, engine as never, audit as never);
  });

  it("does not return another user's simulation", async () => {
    runs.findOne.mockResolvedValue({ id: "sim-1", modelId: "model-1" });
    models.getOwnedModel.mockRejectedValue(new NotFoundException("Model not found"));

    await expect(service.get("sim-1", "user-a")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not persist a run when the engine rejects the calculation", async () => {
    models.getGraph.mockResolvedValue({
      id: "model-1",
      workspaceId: "workspace-1",
      name: "Sample",
      timeUnit: "days",
      nodes: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          type: "supplier",
          name: "Supplier A",
          positionX: 0,
          positionY: 0,
          config: defaultNodeConfig("supplier"),
        },
      ],
      dependencies: [],
    });
    engine.simulate.mockRejectedValue(new BadRequestException("Directed cycle"));

    await expect(
      service.run("model-1", "user-a", { modifications: [{ nodeId: "11111111-1111-4111-8111-111111111111", field: "leadTimeDays", value: 19 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(runs.save).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});
