/* import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	addToCart: async (product) => {
		try {
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
		}));
		get().calculateTotals();
	},
	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
}));
 */

import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,
	isLoading: false,
	error: null,
	isInitialized: false, // Track if cart has been initialized

	// Initialize cart - should be called when app loads
	initializeCart: async () => {
		if (get().isInitialized) return;

		try {
			set({ isLoading: true });
			const res = await axios.get("/cart");

			// Handle case where user has no cart items (empty array or null/undefined)
			const initialCart = Array.isArray(res.data) ? res.data : [];

			set({
				cart: initialCart,
				isInitialized: true,
				error: null
			});
			get().calculateTotals();
		} catch (error) {
			// If 404 or empty cart, initialize with empty array
			if (error.response?.status === 404 || error.response?.data?.message?.includes('empty')) {
				set({
					cart: [],
					isInitialized: true,
					error: null
				});
			} else {
				set({
					error: get().handleError(error),
					isInitialized: true // Still mark as initialized even if error
				});
			}
		} finally {
			set({ isLoading: false });
		}
	},

	// Helper method for consistent error handling
	handleError: (error) => {
		const message = error.response?.data?.message || error.message || "An error occurred";
		toast.error(message);
		return message;
	},

	getCartItems: async () => {
		try {
			set({ isLoading: true });
			const res = await axios.get("/cart");

			// Handle both empty array and null/undefined responses
			const cartData = Array.isArray(res.data) ? res.data : [];

			set({
				cart: cartData,
				error: null
			});
			get().calculateTotals();
		} catch (error) {
			// Special handling for empty cart case
			if (error.response?.status === 404) {
				set({ cart: [], error: null });
			} else {
				set({
					cart: [],
					error: get().handleError(error)
				});
			}
		} finally {
			set({ isLoading: false });
		}
	},

	// Other methods remain the same as previous improved implementation
	// (getMyCoupon, applyCoupon, removeCoupon, etc.)
	// ...
	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	calculateTotals: () => {
		const { cart, coupon } = get();

		// Handle case where cart might be null/undefined
		const safeCart = Array.isArray(cart) ? cart : [];

		const subtotal = safeCart.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
			0
		);

		let total = subtotal;

		if (coupon && coupon.discountPercentage) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = Math.max(0, subtotal - discount);
		}

		set({ subtotal, total });
	},
}));