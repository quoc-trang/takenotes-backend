import prisma from "../lib/prisma";

type RegiserPayload = {
  email: string;
  password: string;
};

type RegiserResponse = {
  id: string;
  email: string;
  createdAt: Date;
};

type LoginPayload = {
  email: string;
  password: string;
};

const authService = {
  register: async (data: RegiserPayload): Promise<RegiserResponse> => {
    return prisma.user.create({
      data,
      select: { id: true, email: true, createdAt: true },
    });
  },
};

export default authService;
