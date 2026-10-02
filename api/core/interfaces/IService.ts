export interface IService {
  save(body: any): Promise<any>;
  saveAll(body: any): Promise<any>;
  delete(id: number): Promise<any>;
  update(body: any): Promise<any>;
  getAll(): Promise<any[]>;
  getById(id: number): Promise<any | null>;
}
