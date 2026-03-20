import type { TokenService } from "../token/servcie";
import type { Request, Response } from 'express';

export class tokenController {
    constructor(private tokenService: TokenService) { }
    private async generateTokens(id: string, email: string) {
        const payload = { id, email };
        const accessToken = this.tokenService.genarateAccessToken(payload);
        const persistedRefreshToken = await this.tokenService.persistRefreshToken(payload);
        const refreshToken = persistedRefreshToken.refreshToken;

        return { accessToken, refreshToken };
    }
    refreshToken = async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        try {

            const payload = await this.tokenService.verifyRefreshToken(refreshToken);
            console.log("verified payload:", payload);


            const existingToken = await this.tokenService.findRefreshToken(refreshToken);
            if (!existingToken) {
                return res.status(403).json({
                    message: "Refresh token not found in database"
                });
            }


            const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                await this.generateTokens(payload.id, payload.email);


            await this.tokenService.deleteRefreshToken(refreshToken);
            console.log("Tokens refreshed successfully");

            return res.status(200).json({
                message: "Tokens refreshed successfully",
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            });

        } catch (err) {
            console.error("Refresh token error:", err);
            return res.status(403).json({
                message: "Invalid or expired refresh token"
            });
        }
    }
}