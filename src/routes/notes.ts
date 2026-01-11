import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";
import { noteService } from "../services/noteService";

const router = Router();

// Get all notes for authenticated user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    logger.info(`Fetching notes for user: ${req.user!.id}`);

    const notes = await noteService.findAllByUserId(req.user!.id);

    logger.info(`Retrieved ${notes.length} notes for user: ${req.user!.id}`);
    res.json(notes);
  } catch (error) {
    logger.error(`Get notes error for user ${req.user!.id}: ${error}`);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single note
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching note ${id} for user: ${req.user!.id}`);

    const note = await noteService.findByIdAndUserId(id, req.user!.id);

    if (!note) {
      logger.warn(`Note ${id} not found for user: ${req.user!.id}`);
      return res.status(404).json({ message: "Note not found" });
    }

    logger.info(`Retrieved note ${id} for user: ${req.user!.id}`);
    res.json(note);
  } catch (error) {
    logger.error(
      `Get note error for note ${req.params.id}, user ${req.user!.id}: ${error}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// Create new note
router.post(
  "/",
  [
    authenticateToken,
    body("title").trim().isLength({ min: 1, max: 255 }),
    body("content").trim().isLength({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      logger.info(`Creating new note for user: ${req.user!.id}`);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(
          `Note creation validation failed for user ${
            req.user!.id
          }: ${JSON.stringify(errors.array())}`
        );
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content } = req.body;

      const note = await noteService.create({
        title,
        content,
        updatedAt: new Date(),
        userId: req.user!.id,
      });

      logger.info(
        `Note created successfully: ${note.id} for user: ${req.user!.id}`
      );
      res.status(201).json(note);
    } catch (error) {
      logger.error(`Create note error for user ${req.user!.id}: ${error}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update note
router.put(
  "/:id",
  [
    authenticateToken,
    body("title").trim().isLength({ min: 1, max: 255 }),
    body("content").trim().isLength({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Updating note ${id} for user: ${req.user!.id}`);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(
          `Note update validation failed for note ${id}, user ${
            req.user!.id
          }: ${JSON.stringify(errors.array())}`
        );
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { title, content } = req.body;

        const updatedNote = await noteService.update(id, req.user!.id, {
          title,
          content,
        });

        logger.info(
          `Note ${id} updated successfully for user: ${req.user!.id}`
        );
        res.json(updatedNote);
      } catch (error: any) {
        if (error?.code === "P2025") {
          logger.warn(
            `Note ${id} not found for update by user: ${req.user!.id}`
          );
          return res.status(404).json({ message: "Note not found" });
        }

        throw error;
      }
    } catch (error) {
      logger.error(
        `Update note error for note ${req.params.id}, user ${
          req.user!.id
        }: ${error}`
      );
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete note
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting note ${id} for user: ${req.user!.id}`);

    try {
      await noteService.delete(id, req.user!.id);
      logger.info(`Note ${id} deleted successfully for user: ${req.user!.id}`);
      res.json({ message: "Note deleted successfully" });
    } catch (error: any) {
      if (error?.code === "P2025") {
        logger.warn(
          `Note ${id} not found for deletion by user: ${req.user!.id}`
        );
        return res.status(404).json({ message: "Note not found" });
      }
      throw error;
    }
  } catch (error) {
    logger.error(
      `Delete note error for note ${req.params.id}, user ${
        req.user!.id
      }: ${error}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
