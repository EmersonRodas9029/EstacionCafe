export interface SaveIngredientDTO {
    name: string;
    quantity: number;
    productId: number;
    consumableId: number;
}

export interface IngredientItemDTO {
    ingredientId: number;
    name: string;
    quantity: number;
    productId: number;
    consumableId: number;
    product?: {
        productId: number;
        name: string;
        description: string;
        price: number;
        cost: number;
    };
    consumable?: {
        consumableId: number;
        name: string;
        cost: number;
        unitMeasurement: string;
    };
}

export interface UpdateIngredientDTO {
    ingredientId?: number;
    name?: string;
    quantity?: number;
    productId?: number;
    consumableId?: number;
}

export interface ResponseIngredientDTO {
    ingredientId: number;
    name: string;
    quantity: number;
    productId: number;
    consumableId: number;
}

export interface IngredientCostCalculationDTO {
    ingredientId: number;
    name: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unitMeasurement: string;
}

export interface ProductIngredientsSummaryDTO {
    productId: number;
    productName: string;
    ingredients: IngredientCostCalculationDTO[];
    totalIngredientsCost: number;
    productCost: number;
    suggestedPrice: number;
}
