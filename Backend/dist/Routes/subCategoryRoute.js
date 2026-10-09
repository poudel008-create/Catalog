"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subCategoryController_1 = require("../Controllers/subCategoryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorization_1 = require("../middleware/authorization");
const router = express_1.default.Router();
// PUBLIC
router.get("/", subCategoryController_1.getSubCategories);
// ADMIN ONLY
router.post("/", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), subCategoryController_1.createSubCategory);
router.put("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), subCategoryController_1.updateSubCategory);
router.delete("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), subCategoryController_1.deleteSubCategory);
exports.default = router;
