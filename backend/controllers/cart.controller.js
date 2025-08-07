import Product from "../models/product.model.js";

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

export const getCartProducts = async (req, res) => {
	try {
		// 1. Check if user exists and has cartItems
		if (!req.user) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		// 2. Handle case where cartItems doesn't exist or is empty
		if (!req.user.cartItems || !Array.isArray(req.user.cartItems) || req.user.cartItems.length === 0) {
			return res.status(200).json([]); // Explicitly return empty array
		}

		// 3. Safely convert cartItems to product IDs
		const cartItemIds = req.user.cartItems.map(item => {
			// Handle both string IDs and object IDs with quantity
			if (typeof item === 'object' && item._id) return item._id;
			if (typeof item === 'object' && item.id) return item.id;
			return item; // Assume it's already an ID string
		}).filter(Boolean); // Remove any undefined/null values

		// 4. Get products from database
		const products = await Product.find({ _id: { $in: cartItemIds } });

		// 5. Create quantity map (handles both object and array formats)
		const quantityMap = {};
		req.user.cartItems.forEach(item => {
			const id = (typeof item === 'object' ? item._id || item.id : item)?.toString();
			if (id) {
				quantityMap[id] = (typeof item === 'object' ? item.quantity : 1) || 1;
			}
		});

		// 6. Format response with quantities
		const cartItems = products.map(product => ({
			...product.toJSON(),
			quantity: quantityMap[product._id.toString()] || 1
		}));

		res.status(200).json(cartItems);
	} catch (error) {
		console.error("Error in getCartProducts:", error);
		// Return empty array on error to prevent frontend crashes
		res.status(500).json({
			message: "Error retrieving cart items",
			error: error.message,
			cartItems: [] // Fallback empty array
		});
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find((item) => item.id === productId);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item) => item.id !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


