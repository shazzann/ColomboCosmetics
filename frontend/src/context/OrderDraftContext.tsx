import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface CartItem {
    tempId: string;
    product_id?: string;
    name: string;
    quantity: number;
    cost_price: number | string;
    selling_price: number | string;
    isManual: boolean;
}

interface OrderDetails {
    customer_name: string;
    mobile_number: string;
    address: string;
    shipping_method: string;
    shipping_cost: number;
    notes: string;
}

interface OrderDraftContextType {
    orderDetails: OrderDetails;
    setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
    items: CartItem[];
    setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
    weight: number | '';
    setWeight: React.Dispatch<React.SetStateAction<number | ''>>;
    draftId: string | null;
    setDraftId: React.Dispatch<React.SetStateAction<string | null>>;
    resetDraft: () => void;
    isAutoSaving: boolean;
}

const OrderDraftContext = createContext<OrderDraftContextType | undefined>(undefined);

const STORAGE_KEY = 'colombo_cosmetics_order_draft';

const defaultOrderDetails: OrderDetails = {
    customer_name: '',
    mobile_number: '',
    address: '',
    shipping_method: 'COD',
    shipping_cost: 0,
    notes: ''
};

export const OrderDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state from localStorage
    const [orderDetails, setOrderDetails] = useState<OrderDetails>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).orderDetails || defaultOrderDetails;
            } catch (e) {
                return defaultOrderDetails;
            }
        }
        return defaultOrderDetails;
    });

    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).items || [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    const [weight, setWeight] = useState<number | ''>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).weight || '';
            } catch (e) {
                return '';
            }
        }
        return '';
    });

    const [draftId, setDraftId] = useState<string | null>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).draftId || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    const [lastSavedState, setLastSavedState] = useState<string>('');
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    // Save to localStorage whenever state changes
    useEffect(() => {
        const stateToSave = { orderDetails, items, weight, draftId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [orderDetails, items, weight, draftId]);

    const resetDraft = useCallback(() => {
        setOrderDetails(defaultOrderDetails);
        setItems([]);
        setWeight('');
        setDraftId(null);
        localStorage.removeItem(STORAGE_KEY);
        setLastSavedState('');
    }, []);

    const autoSave = useCallback(async () => {
        // Only auto-save if there's either a customer name or at least one item
        if (!orderDetails.customer_name && items.length === 0) return;

        const currentState = JSON.stringify({ orderDetails, items, weight });
        if (currentState === lastSavedState) return;

        setIsAutoSaving(true);
        try {
            const payload = {
                ...orderDetails,
                customer_name: orderDetails.customer_name || `Untitled Draft (${new Date().toLocaleDateString()})`,
                status: 'DRAFT',
                items: items.map(item => ({
                    productId: item.isManual ? undefined : item.product_id,
                    name: item.name,
                    quantity: Number(item.quantity),
                    cost_price: Number(item.cost_price),
                    selling_price: Number(item.selling_price)
                }))
            };

            if (draftId) {
                await api.put(`/orders/${draftId}`, payload);
            } else {
                const { data } = await api.post('/orders', payload);
                setDraftId(data.id);
            }
            setLastSavedState(currentState);
            console.log('Draft auto-saved');
        } catch (error) {
            console.error('Auto-save failed', error);
        } finally {
            setIsAutoSaving(false);
        }
    }, [orderDetails, items, weight, draftId, lastSavedState]);

    // Debounced auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            autoSave();
        }, 5000); // 5 seconds debounced (slightly longer for global context)

        return () => clearTimeout(timeout);
    }, [autoSave]);

    return (
        <OrderDraftContext.Provider value={{
            orderDetails, setOrderDetails,
            items, setItems,
            weight, setWeight,
            draftId, setDraftId,
            resetDraft,
            isAutoSaving
        }}>
            {children}
        </OrderDraftContext.Provider>
    );
};

export const useOrderDraft = () => {
    const context = useContext(OrderDraftContext);
    if (context === undefined) {
        throw new Error('useOrderDraft must be used within an OrderDraftProvider');
    }
    return context;
};
