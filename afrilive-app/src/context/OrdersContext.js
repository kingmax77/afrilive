import React, { createContext, useContext, useState, useEffect } from 'react';
import { getOrders, saveOrders, upsertSharedOrder } from '../utils/storage';

const CURRENCY_SYMBOL = {
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  USD: '$',
};

function buildSharedOrder(order) {
  const now = Date.now();
  return {
    id:               order.id,
    productName:      order.productName,
    sellerName:       order.sellerName,
    sellerLocation:   order.sellerLocation || null,
    price:            order.price,
    currency:         CURRENCY_SYMBOL[order.currency] ?? order.currency,
    smartAddressCode: order.smartAddressCode,
    status:           order.status || 'confirmed',
    riderId:          order.riderId || null,
    riderName:        order.riderName || null,
    riderPhone:       order.riderPhone || null,
    riderLocation:    order.riderLocation || null,
    estimatedDelivery: order.estimatedDelivery || '45 mins',
    orderedAt:        now,
    updatedAt:        now,
  };
}

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      const saved = await getOrders();
      if (saved?.length) setOrders(saved);
    })();
  }, []);

  const addOrder = (order) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      saveOrders(next);
      return next;
    });

    const sharedOrder = buildSharedOrder(order);
    upsertSharedOrder(sharedOrder);
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
