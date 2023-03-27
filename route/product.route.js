const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const { createProduct, updateProduct, deleteProduct, getAProduct, getManyProducts, addToWishlist, rateProduct, updateImages } = require("../controller/product.controller");
const uploadCloud = require("../middleware/uploader");

router.post("/", authMiddleware, isAdmin, createProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);
router.get("/:id", getAProduct);
router.get("/", getManyProducts);
router.post("/wishlist", authMiddleware, addToWishlist);
router.post("/rating", authMiddleware, rateProduct);
router.post("/upload/:id", authMiddleware, isAdmin, uploadCloud.array("images"), updateImages);


module.exports = router;