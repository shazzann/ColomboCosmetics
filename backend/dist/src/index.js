"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const client_1 = __importDefault(require("./db/client"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Colombo Cosmetics API' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// Force nodemon restart for new permissions
app.get("/db-check", async (req, res) => {
    try {
        await client_1.default.user.findFirst();
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});
