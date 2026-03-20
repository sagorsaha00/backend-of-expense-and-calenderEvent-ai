

import type { UserSchema } from "../DatabaseSchema";
import { User } from "../DatabaseSchema";
import bcrypt from 'bcrypt'
import type { Request, Response } from 'express';
import type { TokenService } from "../token/servcie";


export class functionController {
    constructor(private tokenService: TokenService) { }


    saveGoogleUser = async (data: UserSchema, req: Request, res: Response) => {
        try {
            console.log("data", data)
            let user = await User.findOne({ id: data.id });

            if (user) {
                console.log("User already exists:", user.email);
                return user;
            }

            user = new User({
                id: data.id,
                email: data.email,
                verifiedEmail: data.verifiedEmail,
                name: data.name,
                givenName: data.givenName,
                familyName: data.familyName,
                picture: data.picture,
            });

            await user.save();
            const payload = { id: data.id, email: data.email };
            console.log("payload", payload);

            const accessToken = this.tokenService.genarateAccessToken(payload);
            console.log("accessToken", accessToken);

            const persistedRefreshToken = await this.tokenService.persistRefreshToken(payload);
            const persistId = persistedRefreshToken.id.toHexString();
            console.log('persistId', persistId)
            console.log("persistedRefreshToken", persistedRefreshToken)
            const refreshToken = this.tokenService.genarateRefreshToken({
                ...payload,
                id: persistId,
            });

            console.log("refreshToken", refreshToken)
            return new Response(JSON.stringify({
                userData: user,
                token: { accessToken, refreshToken }
            }), {
                status: 201,
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            console.error("Error saving user:", err);
            throw err;
        }
    }


    registerFuncUser = async (req: Request, res: Response) => {
        try {
            const { firstname, lastname, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            let useremail = await User.findOne({ email: email });

            if (useremail) {
                return res.status(400).json({
                    message: "Email already used by another person"
                });
            }

            const user = new User({
                firstname, lastname, email,
                password: hashedPassword
            });

            await user.save();

            return res.status(201).json({
                message: "User registered successfully",
                user: user
            });

        } catch (error) {
            return res.status(500).json({
                message: "Server error", error
            });
        }
    }
}
