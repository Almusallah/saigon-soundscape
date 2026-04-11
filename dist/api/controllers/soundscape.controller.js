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
exports.SoundscapeController = void 0;
const models_1 = require("../../core/database/models");
const backblaze_1 = require("../../core/storage/providers/backblaze");
class SoundscapeController {
    static createRecording(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No audio file uploaded or file is too large. Maximum file size is 30MB.'
                    });
                }
                const { url, key } = yield backblaze_1.BackblazeStorage.uploadAudio(req.file);
                const recording = yield models_1.AudioMarker.create({
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
                    },
                    description: req.body.description,
                    audioPath: url,
                    audioKey: key,
                    metadata: {
                        mimetype: req.file.mimetype,
                        size: req.file.size
                    }
                });
                res.status(201).json({
                    success: true,
                    data: recording,
                    message: 'Recording archived successfully'
                });
            }
            catch (error) {
                console.error('Error creating recording:', error);
                if (error instanceof Error && error.message.includes('File size exceeds')) {
                    return res.status(400).json({
                        success: false,
                        message: 'File size exceeds the maximum limit of 30MB'
                    });
                }
                res.status(500).json({
                    success: false,
                    message: 'Server error while processing recording'
                });
            }
        });
    }
    static getRecordings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const recordings = yield models_1.AudioMarker.find();
                res.status(200).json({
                    success: true,
                    data: recordings
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Could not retrieve recordings'
                });
            }
        });
    }
    static getSignedUploadUrl(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).json({
                    success: true,
                    uploadUrl: 'https://example.com/upload',
                    expiresAt: new Date(Date.now() + 3600000)
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Could not generate upload URL'
                });
            }
        });
    }
}
exports.SoundscapeController = SoundscapeController;
