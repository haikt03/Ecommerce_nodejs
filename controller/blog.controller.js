const Blog = require("../model/blog.model");
const asyncHandler = require("express-async-handler");
const validateMongodbId = require("../util/validateMongodbId");
const cloudinary = require("cloudinary").v2;

// Tạo blog
const createBlog = asyncHandler(async (req, res) => {
    const { title } = req.body;
    try {
        const findBlog = await Blog.findOne({ title });
        if (findBlog) {
            throw new Error("Blog already exists");
        }
        const newBlog = await Blog.create(req.body);
        res.json(newBlog)
    } catch (err) {
        throw new Error(err);
    }
})

// Cập nhật blog
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const findBlog = await Blog.update
        const newBlog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
        res.json(newBlog);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy 1 blog
const getABlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const blog = await Blog.findById(id).populate("likes").populate("dislikes");

        // Tăng thêm 1 lượt xem
        blog.numViews++;
        await blog.save();
        res.json(blog);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy tất cả blog
const getAllBlogs = asyncHandler(async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (err) {
        throw new Error(err);
    }
})

//Xóa blog
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        await Blog.findByIdAndDelete(id);
        res.json("Delete Successfully");
    } catch (err) {
    }
})

// Like blog
const likeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    try {
        validateMongodbId(blogId);
        const findBlog = await Blog.findById(blogId);
        if (!blogId) {
            throw new Error("Blog doesn't exist");
        }
        const loginUserId = req.user.id;
        const isLiked = findBlog.isLiked;

        // Kiểm tra xem người dùng đã dislike blog này chưa
        const alreadyDisliked = findBlog.dislikes.find(
            (userId) => (userId.toString() === loginUserId.toString())
        );

        // Nếu đã dislike blog thì cập nhật lại mảng dislikes và isDisliked
        if (alreadyDisliked) {
            const blog = await Blog.findByIdAndUpdate(blogId,
                {
                    $pull: { dislikes: loginUserId },
                    isDisliked: false,
                }, { new: true });
        }

        // Thực hiện like blog
        if (isLiked) {
            const blog = await Blog.findByIdAndUpdate(blogId, {
                $pull: { likes: loginUserId },
                isLiked: false
            }, { new: true })
            res.json(blog);
        } else {
            const blog = await Blog.findByIdAndUpdate(blogId, {
                $push: { likes: loginUserId },
                isLiked: true
            }, { new: true })
            res.json(blog);
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Dislike blog
const dislikeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    try {
        validateMongodbId(blogId);
        const findBlog = await Blog.findById(blogId);
        if (!blogId) {
            throw new Error("Blog doesn't exist");
        }
        const loginUserId = req.user.id;
        const isDisliked = findBlog.isDisliked;

        // Kiểm tra xem người dùng đã like blog này chưa
        const alreadyLiked = findBlog.likes.find(
            (userId) => (userId.toString() === loginUserId.toString())
        );

        // Nếu đã like blog thì cập nhật lại mảng likes và isliked
        if (alreadyLiked) {
            const blog = await Blog.findByIdAndUpdate(blogId,
                {
                    $pull: { likes: loginUserId },
                    isLiked: false,
                }, { new: true });
        }

        // Thực hiện dislike blog
        if (isDisliked) {
            const blog = await Blog.findByIdAndUpdate(blogId, {
                $pull: { dislikes: loginUserId },
                isDisliked: false
            }, { new: true })
            res.json(blog);
        } else {
            const blog = await Blog.findByIdAndUpdate(blogId, {
                $push: { dislikes: loginUserId },
                isDisliked: true
            }, { new: true })
            res.json(blog);
        }
    } catch (err) {
        throw new Error(err);
    }
})


// Tải ảnh lên
const updateImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fileData = req.files;
    try {
        validateMongodbId(id);
        let blog = await Blog.findById(id);
        if (!blog) {
            throw new Error("Blog doesn't exist");
        }
        if (!fileData) {
            throw new Error("No file uploaded!");
        }
        for (let i = 0; i < fileData.length; i++) {
            blog.images.push({
                filename: fileData[i].filename,
                path: fileData[i].path
            })
        }
        await blog.save();
        res.json(blog);
    } catch (err) {
        let filenames = fileData.map((item) => item.filename);
        cloudinary.api.delete_resources(filenames);
        throw new Error(err);
    }
})

module.exports = {
    createBlog,
    updateBlog,
    getABlog,
    getAllBlogs,
    deleteBlog,
    likeBlog,
    dislikeBlog,
    updateImages
}