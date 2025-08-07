// import Product from "../models/product.model.js";


// export const getCartProducts = async (req, res) => {
// 	try {
// 		const products = await Product.find({ _id: { $in: req.user.cartItems } });

// 		// add quantity for each product
// 		const cartItems = products.map((product) => {
// 			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
// 			return { ...product.toJSON(), quantity: item.quantity };
// 		});

// 		res.json(cartItems);
// 	} catch (error) {
// 		console.log("Error in getCartProducts controller", error.message);
// 		res.status(500).json({ message: "Server error", error: error.message });
// 	}
// };



// export const addToCart = async (req, res) => {
// 	try {
// 		const { productId } = req.body;
// 		const user = req.user;

// 		const existingItem = user.cartItems.find((item) => item.id === productId);
// 		if (existingItem) {
// 			existingItem.quantity += 1;
// 		} else {
// 			user.cartItems.push(productId);
// 		}

// 		await user.save();
// 		res.json(user.cartItems);
// 	} catch (error) {
// 		console.log("Error in addToCart controller", error.message);
// 		res.status(500).json({ message: "Server error", error: error.message });
// 	}
// };

// export const removeAllFromCart = async (req, res) => {
// 	try {
// 		const { productId } = req.body;
// 		const user = req.user;
// 		if (!productId) {
// 			user.cartItems = [];
// 		} else {
// 			user.cartItems = user.cartItems.filter((item) => item.id !== productId);
// 		}
// 		await user.save();
// 		res.json(user.cartItems);
// 	} catch (error) {
// 		res.status(500).json({ message: "Server error", error: error.message });
// 	}
// };

// export const updateQuantity = async (req, res) => {
// 	try {
// 		const { id: productId } = req.params;
// 		const { quantity } = req.body;
// 		const user = req.user;
// 		const existingItem = user.cartItems.find((item) => item.id === productId);

// 		if (existingItem) {
// 			if (quantity === 0) {
// 				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
// 				await user.save();
// 				return res.json(user.cartItems);
// 			}

// 			existingItem.quantity = quantity;
// 			await user.save();
// 			res.json(user.cartItems);
// 		} else {
// 			res.status(404).json({ message: "Product not found" });
// 		}
// 	} catch (error) {
// 		console.log("Error in updateQuantity controller", error.message);
// 		res.status(500).json({ message: "Server error", error: error.message });
// 	}
// };


import Product from "../models/product.model.js";

// EFFICIENT & CORRECT: Fetches full product details for items in cart
export const getCartProducts = async (req, res) => {
    try {
        // Create a map of quantities for quick, efficient lookup
        const quantityMap = req.user.cartItems.reduce((map, item) => {
            map[item.product] = item.quantity;
            return map;
        }, {});

        // Get just the product IDs to query the database
        const productIds = req.user.cartItems.map(item => item.product);

        const productsFromDB = await Product.find({ _id: { $in: productIds } });

        // Combine the product details with their correct quantity from the map
        const cartProducts = productsFromDB.map((product) => ({
            ...product.toObject(), // Use .toObject() for a plain JS object
            quantity: quantityMap[product._id.toString()]
        }));

        res.json(cartProducts);

    } catch (error) {
        console.error("Error in getCartProducts controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// CORRECTED: Always adds a product object, never a string
export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        // Find item by its product ID
        const existingItem = user.cartItems.find(
            (item) => item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // CRITICAL FIX: Push the full object with product and quantity
            user.cartItems.push({ product: productId, quantity: 1 });
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.error("Error in addToCart controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// CORRECTED: Updates quantity or removes item correctly
export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(
            (item) => item.product.toString() === productId
        );

        if (!existingItem) {
            return res.status(404).json({ message: "Product not in cart" });
        }
        
        // If quantity is 0 or less, remove the item
        if (quantity <= 0) {
            user.cartItems = user.cartItems.filter(
                (item) => item.product.toString() !== productId
            );
        } else {
            existingItem.quantity = quantity;
        }

        await user.save();
        res.status(200).json(user.cartItems);

    } catch (error) {
        console.error("Error in updateQuantity controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// CORRECTED: Removes one item or clears the entire cart
export const removeAllFromCart = async (req, res) => {
    try {
        // Renamed for clarity
        const { productIdToRemove } = req.body;
        const user = req.user;

        // If no specific product ID is provided, clear the entire cart
        if (!productIdToRemove) {
            user.cartItems = [];
        } else {
            // Filter out the specific product
            user.cartItems = user.cartItems.filter(
                (item) => item.product.toString() !== productIdToRemove
            );
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.error("Error in removeAllFromCart controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};