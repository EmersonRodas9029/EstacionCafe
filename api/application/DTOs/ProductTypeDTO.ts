export interface SaveProductTypeDTO {
  name: string;
}

export interface ProductTypeItemDTO {
  productTypeId: number;
  name: string;
}

export interface UpdateProductTypeDTO {
  productTypeId?: number;
  name?: string;
}
