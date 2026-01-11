import { prisma } from "../lib/prisma";

const userService = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
};

export default userService;
