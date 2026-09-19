import { config } from "./app.config";
import { findByIdUserService } from "../modules/Auth/user.service";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "node:http";

interface JwtPayload {
  userId: string;
}

export const httpAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication required"
      });
      return;
    }

    const token = authorization.slice(7);

    const payload = jwt.verify(token, config.JWT_SECRET, {
      audience: "user",
      algorithms: ["HS256"]
    }) as JwtPayload;

    const user = await findByIdUserService(payload.userId);

    if (!user) {
      res.status(401).json({
        message: "User not found"
      });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token"
    });
    return;
  }
};

export const authenticateWebSocket = async (token: string) => {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, {
      audience: "user",
      algorithms: ["HS256"]
    }) as JwtPayload;

    console.log(payload);

    const user = await findByIdUserService(payload.userId);

    console.log(user);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};
