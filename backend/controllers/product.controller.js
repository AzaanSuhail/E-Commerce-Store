import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}); //find all products
        res.json({products});
    }
    catch (error) {
        console.log("Error in get all products controller", error);

        res.status(500).json({ message: "Server error", error: error.message });
    }
}



export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");


        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts))
        }

        //? if not in redis then fetch from mongodb
        featuredProducts = await Product.find({ isFeatured: true }).lean(); //~ What this lean does it converts the mongoose object/document to a plain javascript object and increase the performance as well

        //! store in redis for future quick access
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.json(featuredProducts);
    }
    catch (error) {
        console.log("Error in get featured products controller", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, isFeatured } = req.body;

        let cloudinaryResponse = null;
        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" }); //upload the image to the cloudinary that admin pass
        }
        
        
        if (!name || !description || !price || !image || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category,
            isFeatured
        })

        res.status(201).json(product);
    }
    catch (error) {
        console.log("Error in create product controller ", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}



export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        res.json(deletedProduct);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]; //*this will have id of deleted image 

            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Successfully Deleted image from cloudinary ✅");
            } catch (error) {
                console.log("Error in deleting image from cloudinary ❌", error);

            }

        }

        await Product.findByIdAndDelete(req.params.id);


    }
    catch (error) {
        console.log("Error in delete product controller", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])

        res.json(products);
    }
    catch (error) {
        console.log("Error in get recommended products controller ❌", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const products = await Product.find({ category });

        res.json({products});
    }
    catch (error) {
        console.log("Error in get products by category controller", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();

            //Now we will update the cache that redis for optimization and fast retrieval of data
            await updateFeaturedProductsCache(); //! might cause an issue

            res.json(updatedProduct);
        }

        else {
            res.status(404).json({ message: "Product not found" });
        }
    }

    catch (error) {
        console.log("Error in toggle featured product controller ❌", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateFeaturedProductsCache(){
    try {
        const featuredProducts=await Product.find({isFeatured:true}).lean();
        await redis.set("featured_products",JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in updating featured products cache ❌",error);
        
    }
}