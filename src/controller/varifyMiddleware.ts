import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
}

const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log("authHeadre", authHeader)
    console.log("authHeader", authHeader)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("token", token)
    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_SECRET as string
        ) as JwtPayload;

        (req as any).user = decoded;
        console.log("decode", decoded)
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Access token expired" });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid access token" });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

export default verifyAccessToken;