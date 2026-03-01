import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    }, []);

    return (
        <OrderDraftContext.Provider value={{
            orderDetails, setOrderDetails,
            items, setItems,
            weight, setWeight,
            draftId, setDraftId,
            resetDraft
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
