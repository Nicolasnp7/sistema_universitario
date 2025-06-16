"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const response = {
        success: true,
        message: '🚀 Ruta de inscripciones funcionando en TypeScript!',
        data: []
    };
    res.status(200).json(response);
});
exports.default = router;
//# sourceMappingURL=inscripciones.js.map