import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { UnauthorizedError, AccountLockedError } from "../../../shared/types/errors.js";
import { success, noContent } from "../../../shared/utils/response.js";
import { _config } from "../../../shared/lib/config.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { z } from "zod";

// Shared (btw frontend and backend)
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export type LoginAuth = z.infer<typeof loginSchema>;


export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const input = req.validated!.body as LoginAuth;

  try {
    const result = await authService.login(input);

    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = result.user.id;
      req.session.role = result.user.role;
      req.session.authenticatedAt = Date.now();


      req.session.save((err) => {
        if (err) return next(err);

        success(res, {
          user: result.user,
        });
      });
    });
  } catch (error) {
    // Expose lockout info so the client can show a countdown
    if (error instanceof AccountLockedError) {
      return next(error);
    }
    next(error);
  }
});



export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    noContent(res);
  });
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72),
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.validated!.body as z.infer<
      typeof changePasswordSchema
    >;
    await authService.changePassword(userId, currentPassword, newPassword);
    noContent(res);
  },
);

export const me = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await authService.me({ id: req.user.userId });

  if (!user) {
    return next(new UnauthorizedError("User not found"));
  }

  success(res, user, undefined, { type: "private", revalidation: "must-revalidate" });
});
