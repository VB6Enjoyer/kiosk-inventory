// electron.d.ts
interface Window {
    api: {
        saveProduct: (newProduct: any) => Promise<any>;
        loadProducts: () => Promise<any[]>;
        deleteProduct: (id: string) => Promise<void>;
        updateProduct: (updatedProduct: any) => Promise<any[]>;
    };
    electron: {
        openCalculator: () => Promise<boolean>;
    };
}