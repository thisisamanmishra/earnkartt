import { Router } from 'express';
import {
  approveUser,
  disapproveUser,
  forgotPassword,
  getAllUsers,
  googleLogin,
  login,
  logout,
  resetPassword,
  signUp,
  getAllApprovedUsers,
  getAllDisapprovedUsers,
} from '../controllers/authController';
import refreshTokenHandler from '../controllers/refreshTokenController';
import loginLimiter from '../middleware/loginLimiter';

const router = Router();

router.post('/signup', signUp);
router.post('/login', loginLimiter, login);
router.get('/logout', logout);

router.post('/google', googleLogin);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.get('/refresh', refreshTokenHandler);
router.get('/users', getAllUsers);
router.get('/users/approved', getAllApprovedUsers);
router.get('/users/disapproved',getAllDisapprovedUsers);
router.patch('/:id/approve', approveUser);
router.patch('/:id/disapprove',disapproveUser)

export default router;
