import express from "express";
import { addShow, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";

const showRouter = express.Router();

showRouter.get('/now-playing', getNowPlayingMovies)
showRouter.post('/add', addShow)
showRouter.get("/all", getShows)
showRouter.get("/:movieId", getShow)

export default showRouter;