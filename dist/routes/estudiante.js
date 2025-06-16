"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const response = {
        success: true,
        message: '🚀 Ruta de estudiantes funcionando en TypeScript!',
        data: []
    };
    res.status(200).json(response);
});
exports.default = router;
//# sourceMappingURL=estudiante.js.map