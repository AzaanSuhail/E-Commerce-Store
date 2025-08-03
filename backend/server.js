import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()) //it allows to parse the body of the request
app.use(cookieParser());

//!Implementing authentication 
app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
    console.log(`server is running on port http://localhost:${PORT}`
    );
    connectDB();
});