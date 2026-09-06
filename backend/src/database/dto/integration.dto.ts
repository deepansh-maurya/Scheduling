import { IsEnum, IsNotEmpty } from "class-validator";
import {
  IntegrationAppTypeEnum,
  IntegrationProviderEnum
} from "../entities/integration.entity";

export class AppTypeDTO {
  @IsEnum(IntegrationAppTypeEnum)
  @IsNotEmpty()
  appType: IntegrationAppTypeEnum;
}

export class ProviderDTO {
  @IsEnum(IntegrationProviderEnum)
  @IsNotEmpty()
  provider: IntegrationProviderEnum;
}
