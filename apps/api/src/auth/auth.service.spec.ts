import { compare, hash } from "bcryptjs";

describe("password hashing", () => {
  it("does not store the plaintext password", async () => {
    const password = "demo-ripple-2026";
    const passwordHash = await hash(password, 12);

    expect(passwordHash).not.toContain(password);
    expect(await compare(password, passwordHash)).toBe(true);
    expect(await compare("wrong-password", passwordHash)).toBe(false);
  });
});
