import express from "express";
import {
  registerUser,
  loginUser, refreshToken, logoutUser,
} from "../Controllers/userController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);


router.post("/refresh", refreshToken);

router.post("/logout", logoutUser);

export default router;