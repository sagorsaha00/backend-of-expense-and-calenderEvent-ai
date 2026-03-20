import createHttpError from "http-errors";
import * as jwt from "jsonwebtoken";
import { RefreshTokenSchema } from "../DatabaseSchema/refreshToken";
import type { JwtPayload } from "jsonwebtoken";


const ACCESS_SECRET = "access_secret_hgfhfdshfgyertvvbvfdf";
const REFRESH_SECRET = "refresh_secret_kjhgfdstrewqazxcvbnm";

export class TokenService {
    constructor(private refreshTokenRepository: typeof RefreshTokenSchema) { }

    genarateAccessToken(payload: JwtPayload) {
        const plainPayload = JSON.parse(JSON.stringify(payload));
        console.log("plainPayload", plainPayload);

        const accessToken = jwt.sign(plainPayload, ACCESS_SECRET, {
            algorithm: "HS256",
            expiresIn: "1m",
            jwtid: String(payload.id),
            subject: payload.email,
            issuer: "expense_tracker",
        });

        if (!accessToken) {
            throw createHttpError(500, "Failed to generate access token");
        }
        return accessToken;
    }

    genarateRefreshToken(payload: JwtPayload) {
        console.log("genarateRefreshToken payload:", payload);

        const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
            algorithm: "HS256",
            expiresIn: "5m",
            issuer: "expense_tracker",
            jwtid: String(payload.id),
        });

        return refreshToken;
    }

    async persistRefreshToken(user: any) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

       
        const refreshToken = this.genarateRefreshToken({
            id: user.id,
            email: user.email,
        });

        const newRefreshToken = new this.refreshTokenRepository({
            userid: user.id,
            email: user.email,
            token: refreshToken, 
            expiresAt,
        });

        try {
            const savedRefreshToken = await newRefreshToken.save();
            console.log("savedRefreshToken:", savedRefreshToken);

        
            return {
                id: savedRefreshToken._id,
                refreshToken: refreshToken,  
            };
        } catch (error) {
            console.error("Error saving refresh token:", error);
            throw createHttpError(500, "Failed to persist refresh token");
        }
    }

    async verifyRefreshToken(token: string): Promise<{ id: string; email: string }> {
        try {
            const payload = jwt.verify(token, REFRESH_SECRET) as {
                id: string;
                email: string;
            };
            return payload;
        } catch (err) {
            throw new Error("Invalid or expired refresh token");
        }
    }

    async findRefreshToken(token: string) {
        return await this.refreshTokenRepository.findOne({ token });
    }

    async deleteRefreshToken(token: string) {
        await this.refreshTokenRepository.deleteOne({ token });
    }
}