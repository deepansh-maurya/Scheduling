import { AppDataSource } from "../../core/config/database.config";
import { User } from "../../core/database/entities/user.entity";

export const findByIdUserService = async (userId: string) => {
  const userRepository = AppDataSource.getRepository(User);
  return await userRepository.findOne({ where: { id: userId } });
};
