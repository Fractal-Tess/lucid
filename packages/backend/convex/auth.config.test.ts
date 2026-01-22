import { describe, it, expect } from "vitest";
import authConfig from "./auth.config";

describe("auth.config", () => {
  it("should export a valid auth config", () => {
    expect(authConfig).toBeDefined();
    expect(authConfig).toHaveProperty("providers");
    expect(Array.isArray(authConfig.providers)).toBe(true);
  });

  it("should have at least one provider", () => {
    expect(authConfig.providers.length).toBeGreaterThan(0);
  });
});
