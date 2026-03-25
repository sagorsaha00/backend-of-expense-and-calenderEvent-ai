import express from 'express'
import { TokenService } from '../token/servcie.js';
import { RefreshTokenSchema } from '../DatabaseSchema/refreshToken.js'
import { functionController } from '../controller/userController.js';
import verifyAccessToken from '../controller/varifyMiddleware.js';
import jwt from 'jsonwebtoken'

const tokenService = new TokenService(RefreshTokenSchema);
export const userController = new functionController(tokenService);

const router = express.Router()


router.post('/googlelogin', async (req, res) => {
    const data = req.body;
    await userController.saveGoogleUser(data, res);
})
router.get('/test', verifyAccessToken, (req, res) => res.status(201).json({
    message: "ok"
}))
router.post('/register', (req, res) => userController.registerFuncUser(req, res))
router.post('/login', (req, res) => userController.loginUser(req, res))
router.get("/grouped/:userId", (req, res) => userController.getExpense(req, res));
router.post("/setpassword", (req, res) => userController.setPassword(req, res));
router.get('/debug-token', verifyAccessToken, (req, res) => {
    const authHeader = req.headers.bearer;


    const ACCESS_SECRET = "access_secret_hgfhfdshfgyertvvbvfdf";
    const token = authHeader as string
    console.log("token", token)
    console.log("SECRET:", process.env.ACCESS_SECRET);
    if (!token) return res.json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET as string);
        console.log("decoded", decoded)
        res.json({ success: true, decoded });
    } catch (err: any) {
        res.json({
            error: err.message,
            secret_exists: !!process.env.ACCESS_SECRET
        });
    }
});
export default router