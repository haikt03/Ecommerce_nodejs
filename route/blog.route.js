const express = require("express");
const router = express.Router();
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");
const { createBlog, updateBlog, getABlog, getAllBlogs, deleteBlog, likeBlog, dislikeBlog, uploadImages } = require("../controller/blog.controller");
const uploadCloud = require("../middleware/uploader");

router.post("/", authMiddleware, isAdmin, createBlog);
router.put("/:id", authMiddleware, isAdmin, updateBlog);
router.get("/:id", getABlog);
router.get("/", getAllBlogs);
router.delete("/:id", authMiddleware, isAdmin, deleteBlog);
router.post("/likes", authMiddleware, likeBlog);
router.post("/dislikes", authMiddleware, dislikeBlog);
router.post("/upload/:id", authMiddleware, isAdmin, uploadCloud.array("images"), uploadImages);

module.exports = router;