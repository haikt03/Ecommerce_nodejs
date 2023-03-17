const express = require("express");
const router = express.Router();
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");
const { createProduct, updateProduct, deleteProduct, getAProduct, getManyProducts } = require("../controller/product.controller");

router.post("/", authMiddleware, isAdmin, createProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);
router.get("/:id", getAProduct);
router.get("/", getManyProducts);


module.exports = router;