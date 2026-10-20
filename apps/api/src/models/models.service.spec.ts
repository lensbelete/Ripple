import { NotFoundException } from "@nestjs/common";
import { ModelsService } from "./models.service";

describe("ModelsService ownership", () => {
  const models = {
    findOne: jest.fn(),
  };

  let service: ModelsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ModelsService(
      models as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it("hides another user's model as not found", async () => {
    models.findOne.mockResolvedValue({
      id: "model-1",
      workspace: { ownerId: "user-b" },
    });

    await expect(service.getOwnedModel("model-1", "user-a")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns a model owned by the current user", async () => {
    const model = {
      id: "model-1",
      workspace: { ownerId: "user-a" },
    };
    models.findOne.mockResolvedValue(model);

    await expect(service.getOwnedModel("model-1", "user-a")).resolves.toBe(model);
  });
});
