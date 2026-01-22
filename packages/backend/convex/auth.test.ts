import { describe, it, expect } from "vitest";
import { authComponent, createAuth } from "./auth";

describe("auth", () => {
  describe("authComponent", () => {
    it("should export authComponent", () => {
      expect(authComponent).toBeDefined();
    });

    it("should have getAuthUser method", () => {
      expect(typeof authComponent.getAuthUser).toBe("function");
    });

    it("should have safeGetAuthUser method", () => {
      expect(typeof authComponent.safeGetAuthUser).toBe("function");
    });

    it("should have getAnyUserById method", () => {
      expect(typeof authComponent.getAnyUserById).toBe("function");
    });

    it("should have adapter method", () => {
      expect(typeof authComponent.adapter).toBe("function");
    });

    it("should have registerRoutes method", () => {
      expect(typeof authComponent.registerRoutes).toBe("function");
    });
  });

  describe("createAuth", () => {
    it("should create an auth instance with a context", () => {
      // Mock context for testing
      const mockCtx = {} as any;
      const auth = createAuth(mockCtx);
      expect(auth).toBeDefined();
    });
  });
});
