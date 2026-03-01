"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = middleware;
var jsonwebtoken_1 = require("jsonwebtoken");
var backend_common_1 = require("@repo/backend-common");
function middleware(req, res, next) {
    var _a;
    var token = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    var decoded = jsonwebtoken_1.default.verify(token, backend_common_1.JWT_SECRET);
    if (decoded) {
        req.userId = decoded.userId;
        next();
    }
    else {
        res.status(403).json({
            message: "unauthorzed"
        });
    }
}
