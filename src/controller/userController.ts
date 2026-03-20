// src/controller/userController.ts

import type { UserSchema } from "../DatabaseSchema";
import { User } from "../DatabaseSchema";
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import type { TokenService } from "../token/servcie";

export class functionController {
    constructor(private tokenService: TokenService) { }

   
    private async generateTokens(id: string, email: string) {
        const payload = { id, email };

        const accessToken = this.tokenService.genarateAccessToken(payload);

        const persistedRefreshToken = await this.tokenService.persistRefreshToken(payload);

       
        const refreshToken = persistedRefreshToken.refreshToken;

        return { accessToken, refreshToken };
    }

 
    registerFuncUser = async (req: Request, res: Response) => {
        try {
            const { firstname, lastname, email, password } = req.body;

          
            if (!firstname || !lastname || !email || !password) {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }

             
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    message: "Email already used by another person"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                firstname,
                lastname,
                email,
                password: hashedPassword
            });

            await user.save();

            
            const { accessToken, refreshToken } = await this.generateTokens(
                user._id.toHexString(),
                user.email
            );

            return res.status(201).json({
                message: "User registered successfully",
                userData: user,
                token: { accessToken, refreshToken }
            });

        } catch (error) {
            console.error("Error registering user:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    }

  
    loginUser = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            console.log("email", email);

            
            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password are required"
                });
            }

            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    message: "User not found. Please register first."
                });
            }

             
            if (!user.password) {
                return res.status(400).json({
                    message: "This account uses Google login. Please login with Google."
                });
            }

          
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    message: "Invalid password"
                });
            }

         
            const { accessToken, refreshToken } = await this.generateTokens(
                user._id.toHexString(),
                user.email
            );

            return res.status(200).json({
                message: "Login successful",
                userData: user,
                token: { accessToken, refreshToken }
            });

        } catch (error) {
            console.error("Error logging in:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    }

 
    saveGoogleUser = async (data: UserSchema, res?: Response) => {
        try {
            console.log("data", data);

            let user = await User.findOne({ id: data.id });

            if (!user) {
                
                user = new User({
                    id: data.id,
                    email: data.email,
                    verifiedEmail: data.verifiedEmail,
                    name: data.name,
                    firstname: data.givenName,
                    lastname: data.familyName,
                    givenName: data.givenName,
                    familyName: data.familyName,
                    picture: data.picture,
                });
                await user.save();
                console.log("New Google user registered:", user.email);
            } else {
                console.log("Google user logged in:", user.email);
            }

          
            const { accessToken, refreshToken } = await this.generateTokens(
                data.id,
                data.email
            );

            const result = {
                userData: user,
                token: { accessToken, refreshToken }
            };

            if (res) {
                return res.status(200).json(result);
            }
            return result;

        } catch (err) {
            console.error("Error with Google auth:", err);
            if (res) {
                return res.status(500).json({ message: "Error saving user", error: err });
            }
            throw err;
        }
    }
 

}