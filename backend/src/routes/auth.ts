import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getDb } from "../lib/db";
import { validationError } from "../lib/errors";
import { created, noContent, ok } from "../lib/response";
import { getAuthContext, jwtAuth } from "../middleware/auth";
import { JwtDenylistRepository } from "../repositories/jwt-denylist";
import { UserRepository } from "../repositories/user";
import { AuthService } from "../services/auth";
import { signInSchema, signUpSchema } from "../validators/auth";

const auth = new Hono();

function getAuthService() {
  const db = getDb();
  const userRepository = new UserRepository(db);
  const jwtDenylistRepository = new JwtDenylistRepository(db);
  return new AuthService(userRepository, jwtDenylistRepository);
}

auth.post(
  "/sign_up",
  zValidator("json", signUpSchema, (result) => {
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(issue.message);
      }
      throw validationError("入力内容に誤りがあります", details);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const authService = getAuthService();

    const result = await authService.signUp(
      body.email,
      body.password,
      body.password_confirmation,
      body.name,
    );

    return created(c, result);
  },
);

auth.post(
  "/sign_in",
  zValidator("json", signInSchema, (result) => {
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(issue.message);
      }
      throw validationError("入力内容に誤りがあります", details);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const authService = getAuthService();

    const result = await authService.signIn(body.email, body.password);

    return ok(c, result);
  },
);

auth.delete("/sign_out", jwtAuth(), async (c) => {
  const { payload } = getAuthContext(c);
  const authService = getAuthService();

  await authService.signOut(payload.jti, new Date(payload.exp * 1000));

  return noContent(c);
});

export default auth;
