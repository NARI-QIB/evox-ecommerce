// filepath: frontend/src/context/CartContext.jsx
import { createContext, useReducer, useEffect, useContext, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const item = action.payload;
      const existItem = state.cartItems.find(
        (x) => x.product === item.product && x.selectedSize === item.selectedSize
      );

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product === existItem.product && x.selectedSize === existItem.selectedSize ? item : x
          ),
        };
      } else {
        return { ...state, cartItems: [...state.cartItems, item] };
      }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        cartItems: state.cartItems.filter(
          (x) => !(x.product === action.payload.product && x.selectedSize === action.payload.selectedSize)
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cartItems: [] };
    case 'LOAD_SERVER_CART': {
      const cleanServerCart = action.payload.filter(
        (item) => item && item.product && typeof item.product === 'string' && /^[0-9a-fA-F]{24}$/.test(item.product)
      );
      return { ...state, cartItems: cleanServerCart };
    }
    case 'MERGE_CARTS': {
      const serverCart = action.payload;
      const merged = [...state.cartItems];

      serverCart.forEach(serverItem => {
        if (serverItem && serverItem.product && typeof serverItem.product === 'string' && /^[0-9a-fA-F]{24}$/.test(serverItem.product)) {
          const exists = merged.find(x => x.product === serverItem.product && x.selectedSize === serverItem.selectedSize);
          if (!exists) merged.push(serverItem);
        }
      });
      return { ...state, cartItems: merged };
    }
    case 'SAVE_SHIPPING_ADDRESS':
      return { ...state, shippingAddress: action.payload };
    case 'SAVE_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { userInfo, updateUserSession } = useContext(AuthContext);
  const [hasMerged, setHasMerged] = useState(false);

  const getInitialCart = () => {
    try {
      const localCart = localStorage.getItem('cartItems');
      if (localCart && localCart !== 'undefined' && localCart !== 'null') {
        const parsedCart = JSON.parse(localCart);
        if (Array.isArray(parsedCart)) {
          return parsedCart
            .map(item => ({ ...item, product: item.product || item._id }))
            .filter(item => item && typeof item.product === 'string' && /^[0-9a-fA-F]{24}$/.test(item.product));
        }
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const getInitialShippingAddress = () => {
    try {
      const val = localStorage.getItem('shippingAddress');
      return val && val !== 'undefined' && val !== 'null' ? JSON.parse(val) : {};
    } catch (error) {
      return {};
    }
  };

  const getInitialPaymentMethod = () => {
    try {
      const val = localStorage.getItem('paymentMethod');
      return val && val !== 'undefined' && val !== 'null' ? JSON.parse(val) : 'Cash on Delivery';
    } catch (error) {
      return 'Cash on Delivery';
    }
  };

  const initialState = {
    cartItems: getInitialCart(),
    shippingAddress: getInitialShippingAddress(),
    paymentMethod: getInitialPaymentMethod(),
  };

  const [state, dispatch] = useReducer(cartReducer, initialState);

  const syncCartMutation = useMutation({
    mutationFn: async (cartItems) => {
      if (!userInfo || !userInfo._id) return null;
      if (!Array.isArray(cartItems)) return null;

      const safeItems = cartItems
        .filter(item => {
          const id = item?.product || item?._id;
          return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
        })
        .map(item => ({
          product: item.product || item._id,
          name: typeof item.name === 'object' ? (item.name.en || 'Unknown') : (item.name || 'Unknown'),
          image: typeof item.image === 'string' ? item.image : '/images/placeholder.png',
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 1,
          selectedSize: item.selectedSize || ''
        }));

      try {
        // 🌟 الحل الجذري هنا: إذا كانت السلة فارغة، نرسل clearCart: true لكي يتجاوز حماية الـ Backend ويمسحها فعلياً
        const { data } = await axios.put('/api/users/profile/cart', {
          cartItems: safeItems,
          clearCart: safeItems.length === 0
        });
        return data;
      } catch (err) {
        // معالجة صامتة لخطأ 401 في حال انتهاء الجلسة لتجنب رسائل الخطأ في الكونسول
        if (err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      if (userInfo && data) updateUserSession({ cart: data });
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    } catch (e) { /* Ignore */ }

    // استدعاء المزامنة فقط عند وجود حساب نشط
    if (userInfo && userInfo._id) {
      syncCartMutation.mutate(state.cartItems);
    }
  }, [state.cartItems, userInfo?._id]);

  useEffect(() => {
    if (!userInfo) {
      setHasMerged(false);
    } else if (!hasMerged) {
      const serverCartLength = userInfo.cart?.length || 0;
      if (state.cartItems.length === 0 && serverCartLength > 0) {
        dispatch({ type: 'LOAD_SERVER_CART', payload: userInfo.cart });
      } else if (state.cartItems.length > 0 && serverCartLength > 0) {
        dispatch({ type: 'MERGE_CARTS', payload: userInfo.cart });
      }
      setHasMerged(true);
    }
  }, [userInfo, hasMerged]);

  const addToCart = (product, qty, selectedSize) => {
    const actualId = product.product || product._id;
    if (!actualId || typeof actualId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(actualId)) return;

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product: actualId,
        name: typeof product.name === 'object' ? (product.name?.en || 'Unknown') : (product.name || 'Unknown'),
        image: product.image,
        price: Number(product.price) || 0,
        countInStock: Number(product.countInStock) || 0,
        qty: Number(qty) || 1,
        selectedSize: selectedSize || '',
      },
    });
  };

  const removeFromCart = (productId, selectedSize = '') => {
    dispatch({ type: 'REMOVE_ITEM', payload: { product: productId, selectedSize } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const saveShippingAddress = (data) => {
    dispatch({ type: 'SAVE_SHIPPING_ADDRESS', payload: data });
    try { localStorage.setItem('shippingAddress', JSON.stringify(data)); } catch (e) { /* Ignore */ }
  };

  const savePaymentMethod = (data) => {
    dispatch({ type: 'SAVE_PAYMENT_METHOD', payload: data });
    try { localStorage.setItem('paymentMethod', JSON.stringify(data)); } catch (e) { /* Ignore */ }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
        addToCart,
        removeFromCart,
        clearCart,
        saveShippingAddress,
        savePaymentMethod
      }}
    >
      {children}
    </CartContext.Provider>
  );
};