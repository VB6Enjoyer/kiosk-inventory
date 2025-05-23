interface Window {
    api: {
        saveProduct: (newProduct: any) => Promise<any>;
        loadProducts: () => Promise<any[]>;
        deleteProduct: (id: string) => Promise<void>;
        updateProduct: (updatedProduct: any) => Promise<any[]>;
        getTheme: () => Promise<string>;
        changeTheme: (theme: string) => Promise<any>;
    };
    electron: {
        openCalculator: () => Promise<boolean>;
        closeApp: () => Promise<Boolean>
    };
}