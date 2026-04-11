"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const backblaze_1 = require("../../core/storage/providers/backblaze");
const router = (0, express_1.Router)();
router.post('/login', admin_controller_1.AdminController.login);
router.delete('/recordings/:id', auth_middleware_1.authMiddleware, admin_controller_1.AdminController.deleteRecording);
router.get('/storage-usage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storageInfo = yield backblaze_1.BackblazeStorage.getStorageUsage();
        res.status(200).json({
            success: true,
            data: storageInfo
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not retrieve storage information'
        });
    }
}));
exports.default = router;
