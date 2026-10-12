import { Request, Response } from "express";
import { asyncHandlerAndValidation } from "../../core/middlewares/withValidation.middleware";
import { LoginDto, RegisterDto } from "../../core/database/dto/auth.dto";
import { loginService, registerService } from "./auth.service";
import { HTTPSTATUS } from "../../core/config/http.config";

export const registerController = asyncHandlerAndValidation(
  RegisterDto,
  "body",
  async (req: Request, res: Response, registerDTO) => {
    const { user } = await registerService(registerDTO);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
      user,
    });
  }
);

export const loginController = asyncHandlerAndValidation(
  LoginDto,
  "body",
  async (req: Request, res: Response, loginDto) => {
    const { user, accessToken, expiresAt } = await loginService(loginDto);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "User logged in successfully",
      user,
      accessToken,
      expiresAt,
    });
  }
);
