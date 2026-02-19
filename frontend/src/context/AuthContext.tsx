import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id?: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User, remember?: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check sessionStorage first (current session), then localStorage (remembered session)
        const sessionToken = sessionStorage.getItem('token');
        const sessionUser = sessionStorage.getItem('user');

        const localToken = localStorage.getItem('token');
        const localUser = localStorage.getItem('user');

        if (sessionToken && sessionUser) {
            setToken(sessionToken);
            setUser(JSON.parse(sessionUser));
        } else if (localToken && localUser) {
            setToken(localToken);
            setUser(JSON.parse(localUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User, remember: boolean = false) => {
        if (remember) {
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('token', newToken);
            sessionStorage.setItem('user', JSON.stringify(userData));
        }
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
