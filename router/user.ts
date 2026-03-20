import express from 'express'
import { TokenService } from '../src/token/servcie';
import { RefreshTokenSchema } from '../src/DatabaseSchema/refreshToken'
import { functionController } from '../src/controller/userController';


const tokenService = new TokenService(RefreshTokenSchema);
export const userController = new functionController(tokenService);

const router = express.Router()


router.post('/google', async (req, res) => {
    const data = req.body;
    await userController.saveGoogleUser(data, res);
})
router.post('/register', (req, res) => userController.registerFuncUser(req, res))
router.post('/login', (req, res) => userController.loginUser(req, res))
export default router