"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const catalogController_1 = require("../Controllers/catalogController");
const upload_1 = __importDefault(require("../middleware/upload"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorization_1 = require("../middleware/authorization");
const router = express_1.default.Router();
// PUBLIC
router.get("/", catalogController_1.getCatalogs);
router.get("/public", catalogController_1.getPublishedCatalogs);
router.get("/:id", catalogController_1.getCatalog);
// ADMIN ONLY
router.post("/", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), upload_1.default.single("coverImage"), catalogController_1.createCatalog);
router.put("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), upload_1.default.single("coverImage"), catalogController_1.updateCatalog);
router.delete("/:id", authMiddleware_1.authMiddleware, (0, authorization_1.authorizeRoles)("admin"), catalogController_1.deleteCatalog);
exports.default = router;
