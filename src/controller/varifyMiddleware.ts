import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token: string | undefined = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Access token expired or invalid" });
    }
};

export default verifyAccessToken;