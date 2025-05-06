export interface AdvancedSearch {
    name: string;
    exactName: boolean;
    description: string;
    exactDescription: boolean;
    quantityMin: number;
    quantityMax: number;
    purchaseDateMin: string;
    purchaseDateMax: string;
    expiryDateMin: string;
    expiryDateMax: string;
    noExpiry: boolean;
    costMin: number;
    costMax: number;
}