import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import axios from "axios";
import ConnectDB from "./db";
import { functionController } from './src/controller/userController';
import { TokenService } from './src/token/servcie';
import {RefreshTokenSchema} from './src/DatabaseSchema/refreshToken'

const tokenService = new TokenService(RefreshTokenSchema);
const func = new functionController(tokenService);
dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(express.json());

// ─── Single shared OAuth2 client (credentials set after login) ───────────────
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

 
 
export function getCalendar() {
    return google.calendar({ version: "v3", auth: oauth2Client });
}

app.get('/dashboard', (req, res) => {
    res.json('ok');
});

app.get("/auth/google", (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/calendar"
        ],
    });
    res.redirect(url);
});

app.get("/api/callback/login/user", async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;

        if (!code) {
            return res.status(400).send("No code provided");
        }

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            return res.status(500).send("No access token returned from Google");
        }

        // FIX 3: Set credentials on the shared client so getCalendar() works
        oauth2Client.setCredentials(tokens);

        // FIX 4: Auto-save new tokens when Google silently rotates them
        oauth2Client.on("tokens", (newTokens) => {
            oauth2Client.setCredentials(newTokens);
            console.log("🔄 Tokens refreshed automatically");
        });

        const userInfo = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );

        // FIX 5: Pass both tokens to saveGoogleUser so you can restore them later
        const user = {
            ...userInfo.data,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token ?? null,  // save this!
            token_expiry: tokens.expiry_date ?? null,
        };

        await func.saveGoogleUser(user);   // added await so errors don't get swallowed

        res.redirect("http://localhost:3001/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Google login failed");
    }
});

const PORT = 3001;
app.listen(PORT, async () => {
    await ConnectDB();
    console.log(`Server running on port ${PORT}`);
});