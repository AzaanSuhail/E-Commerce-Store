import Product from "../models/product.model.js";

// export const addToCart = async (req, res) => {
//     try {
//         const { productId } = req.body;
//         const user = req.user;

//         const existingItem = user.cartItems.find(item => item.id == productId);
//         if (existingItem) {
//             existingItem.quantity += 1;
//             await user.save();
//         }
//         else {
//             user.cartItems.push(productId);

//         }

//         await user.save();
//         res.json(user.cartItems);
//     }
//     catch (error) {
//         console.log("Error in add to cart controller❌", error);
//     }
//     res.status(500).json({ message: "Server error", error: error.message });
// }

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		// Find an item where the 'product' field matches the productId
		const existingItem = user.cartItems.find((item) => item.product.equals(productId));

		if (existingItem) {
			// If it exists, just increment the quantity
			existingItem.quantity += 1;
		} else {
			// If it's a new item, push a complete object with quantity 1
			user.cartItems.push({ product: productId, quantity: 1 });
		}

		// Save the updated user document
		await user.save();

		// Send back the corrected and consistent cartItems array
		res.json({ cartItems: user.cartItems });
		
	} catch (error) {
		console.log("Error in addToCart controller ❌", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            user.cartItems = [];
        }

        else {
            user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        
        const existingItem = user.cartItems.find(item => item.id == productId);

        if (existingItem) {
            if (quantity == 0) {
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            }

            existingItem.quantity = quantity;
            await user.save();
            return res.json(user.cartItems);
        }
        else {
            res.status(404).json({ message: "Product not found in cart" });
        }

        
    } catch (error) {
        console.log("Error in update quantity controller❌", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


export const getCartProducts = async (req, res) => {
try {
    const products=await Product.find({_id:{$in:req.user.cartItems}});

    //add quantity for each product
    const cartItems=products.map((product)=>{
        const item=req.user.cartItems.find(cartItem=>cartItem.id==product.id);

        return {...product.toJSON(),quantity:item.quantity};
    })
    res.json(cartItems);

} catch (error) {
    console.log("Error in get cart products controller❌", error);
    res.status(500).json({ message: "Server error", error: error.message });
}
}