import express from 'express'
import { TokenService } from '../src/token/servcie.js';
import { RefreshTokenSchema } from '../src/DatabaseSchema/refreshToken.js'
import { functionController } from '../src/controller/userController';
import verifyAccessToken from '../src/controller/varifyMiddleware';


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
router.get("/grouped/:userId", verifyAccessToken, (req, res) => userController.getExpense(req, res));
router.post("/setpassword", verifyAccessToken, (req, res) => userController.setPassword(req, res));
export default router