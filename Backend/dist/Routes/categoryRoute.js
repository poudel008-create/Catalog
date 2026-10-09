"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../Controllers/categoryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorization_1 = require("../middleware/authorization");
const router = express_1.default.Router();
// PUBLIC
router.get("/", categoryController_1.getCategories);
// ADMIN ONLY
router.post("/", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), categoryController_1.createCategory);
router.put("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), categoryController_1.updateCategory);
router.delete("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), categoryController_1.deleteCategory);
exports.default = router;
