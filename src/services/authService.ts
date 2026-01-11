import { UserCreateInput } from "../generated/prisma/models";
import { prisma } from "../lib/prisma";

type RegiserResponse = {
  id: string;
  email: string;
  createdAt: Date;
};

const authService = {
  register: async (data: UserCreateInput): Promise<RegiserResponse> => {
    return prisma.user.create({
      data,
      select: { id: true, email: true, createdAt: true },
    });
  },
};

export default authService;
