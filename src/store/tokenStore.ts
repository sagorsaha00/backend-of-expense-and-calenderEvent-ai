// ─── src/store/tokenStore.ts ─────────────────────────────────────────────────
import { google } from "googleapis";
import UserModel from "../DatabaseSchema/userModel";

const userTokenStore = new Map<string, any>();

export function saveUserTokens(userId: string, tokens: any) {
    userTokenStore.set(userId, tokens);
}

export async function getCalendar(userId: string) {
    let tokens = userTokenStore.get(userId);

    if (!tokens) {
        const user = await UserModel.findOne({ id: userId });

        if (!user?.access_token) {
            throw new Error(`No tokens found for userId: ${userId}`);
        }

        tokens = {
            access_token: user.access_token,
            refresh_token: user.refresh_token,
            expiry_date: user.token_expiry,
        };
        console.log("token", tokens)
        userTokenStore.set(userId, tokens);
    }

    const client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    client.setCredentials(tokens);

    client.on("tokens", async (newTokens) => {
        const existing = userTokenStore.get(userId) || {};
        const updated = { ...existing, ...newTokens };

        userTokenStore.set(userId, updated);
        client.setCredentials(updated);

        await UserModel.findOneAndUpdate(
            { id: userId },
            {
                access_token: updated.access_token,
                refresh_token: updated.refresh_token ?? existing.refresh_token,
                token_expiry: updated.expiry_date,
            }
        );
    });

    return google.calendar({ version: "v3", auth: client });
}