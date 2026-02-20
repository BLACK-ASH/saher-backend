import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import uploadRouter from "./upload/upload.routes.js";
import path from "path";
import connectDb from "./database/connection.js";
import authRouter from "./auth/auth.routes.js";
import adminRouter from "./admin/admin.routes.js";
import { protectedRoute } from "./libs/middleware/protected-route.js";
import attendenceRouter from "./attendence/attendence.route.js"
// import {verifyToken} from "./attendence/attendence.middleware.js"


// Env Config
dotenv.config()

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(process.cwd(), "public")))

// Databse Connection
await connectDb()

// Routes
app.use("/api/upload", uploadRouter)

app.use("/api/admin",protectedRoute, adminRouter)
app.use("/api/auth", authRouter)
app.use("/", express.static(path.join(process.cwd(), "docs")));



//Mark attendence
app.use("/attendence",protectedRoute,attendenceRouter)


app.get("/", (req, res) => {
  res.status(200).json("This Is Saher Internal Home Page")
})



app.listen(port, () => {
  console.log("Server Started", port)
})
