import { Note } from '@prisma/client';
import prisma from '../lib/prisma';

type NoteSummary = Pick<
    Note,
    'id' | 'title' | 'content' | 'createdAt' | 'updatedAt'
>;

export const noteService = {
    async findAllByUserId(userId: string): Promise<NoteSummary[]> {
        return prisma.note.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    async findByIdAndUserId(id: string, userId: string): Promise<Note | null> {
        return prisma.note.findFirst({
            where: { id, userId },
        });
    },

    async create(data: { title: string; content: string; userId: string }): Promise<Note> {
        return prisma.note.create({ data });
    },

    async update(
        id: string,
        userId: string,
        data: { title: string; content: string }
    ): Promise<Note> {
        return prisma.note.update({
            where: { id, userId },
            data,
        });
    },

    async delete(id: string, userId: string) {
        return prisma.note.delete({ where: { id, userId } });
    },
};
