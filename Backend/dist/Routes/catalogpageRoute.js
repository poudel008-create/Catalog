"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const catalogpageController_1 = require("../Controllers/catalogpageController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorization_1 = require("../middleware/authorization");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// PUBLIC - Get pages
router.get("/:catalogId", catalogpageController_1.getCatalogPages);
// ADMIN
//  Add one or multiple pages
router.post("/:catalogId", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), upload_1.default.array("pages", 20), catalogpageController_1.uploadCatalogPage);
// Update one or multiple pages
router.put("/:catalogId", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), upload_1.default.array("pages", 20), catalogpageController_1.updateCatalogPage);
router.delete("/bulk/:catalogId", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), catalogpageController_1.deleteMultipleCatalogPages);
// Delete one or multiple pages
router.delete("/page/:pageId", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), catalogpageController_1.deleteCatalogPage);
exports.default = router;
