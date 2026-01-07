import { Request, Response, NextFunction } from "express"
import { validationResult } from "express-validator"
import logger from "../utils/logger"

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({error: errors.array()})
    }
    return next()
}