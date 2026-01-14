import { Router, Response, Request } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { validate } from "../middleware/validate";
import authService from "../services/authService";
import userService from "../services/userService";

const router = Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);
      const data = {
        email,
        password: hashedPassword,
      };
      const user = await authService.register(data);
      const jwtSecret = process.env.JWT_SECRET!;
      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
        expiresIn: "24h",
      });
      res.status(201).json({
        message: "User created successfully",
        user,
        token,
      });
    } catch (error: any) {
      // P2002 is Prisma error code
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Email already existed" });
      }

      logger.error(`Registration error: ${error}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await userService.findUserByEmail(email);
      if (!user) {
        logger.warn(`Login failed - user not found: ${email}`);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      logger.error(`Login error: ${error}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
