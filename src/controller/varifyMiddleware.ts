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
    const bearerHeader = req.headers.bearer;

    let token: string | undefined;

    // ✅ support both (standard + your custom)
    if (authHeader) {
        token = authHeader.split(" ")[1];
    } else if (bearerHeader) {
        token = bearerHeader as string;
    }

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    const ACCESS_SECRET = "access_secret_hgfhfdshfgyertvvbvfdf";

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

        (req as any).user = decoded;
        console.log("decoded:", decoded);

        next();
    } catch (error) {
        console.log("JWT ERROR:", error);

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