import express from 'express'
import { tokenController } from '../controller/tokenController.js'
import { RefreshTokenSchema } from '../DatabaseSchema/refreshToken.js'
import { TokenService } from '../token/servcie.js'


const router = express.Router()



const tokenService = new TokenService(RefreshTokenSchema);
const tokencontroller = new tokenController(tokenService)



router.post('/refreshToken', (req, res) => tokencontroller.refreshToken(req, res))

export default router