import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getAuthService } from "../../lib/container";
import { created, noContent, ok } from "../../lib/response";
import { handleValidationError } from "../../lib/validator";
import { getAuthContext, jwtAuth } from "../../shared/middleware/auth";
import { signInSchema, signUpSchema } from "./validators";

const auth = new Hono();

auth.post(
  "/sign_up",
  zValidator("json", signUpSchema, handleValidationError()),
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
  zValidator("json", signInSchema, handleValidationError()),
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
