import express from 'express'
import { tokenController } from '../src/controller/tokenController'
import { RefreshTokenSchema } from '../src/DatabaseSchema/refreshToken'
import { TokenService } from '../src/token/servcie'


const router = express.Router()



const tokenService = new TokenService(RefreshTokenSchema);
const tokencontroller = new tokenController(tokenService)



router.post('/refreshToken', (req, res) => tokencontroller.refreshToken(req, res))

export default router