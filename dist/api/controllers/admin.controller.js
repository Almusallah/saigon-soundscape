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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../../core/database/models");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
class AdminController {
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
                const token = jsonwebtoken_1.default.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({
                    success: true,
                    token,
                    message: 'Admin login successful'
                });
            }
            else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        });
    }
    static deleteRecording(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const recording = yield models_1.AudioMarker.findById(id);
                if (!recording) {
                    return res.status(404).json({
                        success: false,
                        message: 'Recording not found'
                    });
                }
                const s3 = new aws_sdk_1.default.S3({
                    endpoint: process.env.B2_ENDPOINT,
                    accessKeyId: process.env.B2_KEY_ID,
                    secretAccessKey: process.env.B2_APPLICATION_KEY,
                    region: process.env.B2_REGION,
                    s3ForcePathStyle: true
                });
                yield s3.deleteObject({
                    Bucket: process.env.B2_BUCKET,
                    Key: recording.audioKey
                }).promise();
                yield models_1.AudioMarker.findByIdAndDelete(id);
                res.status(200).json({
                    success: true,
                    message: 'Recording deleted successfully'
                });
            }
            catch (error) {
                console.error('Error deleting recording:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server error while deleting recording'
                });
            }
        });
    }
}
exports.AdminController = AdminController;
