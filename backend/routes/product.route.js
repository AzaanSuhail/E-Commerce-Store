import express from 'express';
import { createProduct, deleteProduct, getAllProducts,getFeaturedProducts, getProductsByCategory, getRecommendedProducts, toggleFeaturedProduct } from '../controllers/product.controller.js';
import { protectRoute,adminRoute } from '../middleware/auth.middleware.js';

const router=express.Router();

router.get('/',protectRoute,adminRoute,getAllProducts);
router.get('/featured',getFeaturedProducts);
router.get('/category/:category',getProductsByCategory);
router.get('/recommendations',getRecommendedProducts);
router.delete('/:id',protectRoute,adminRoute,deleteProduct);
router.post('/',protectRoute,adminRoute,createProduct);
router.patch('/',protectRoute,adminRoute,toggleFeaturedProduct);

export default router;