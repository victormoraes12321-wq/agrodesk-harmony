import { apiClient } from './api';

// Types
export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface AssetType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  description?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  value?: number;
  status: string;
  hostname?: string;
  processor?: string;
  ram?: string;
  disk?: string;
  brand?: string;
  model?: string;
  supplierId?: string;
  assetTypeId: string;
  departmentId?: string;
  branchId?: string;
  userId?: string;
  parentId?: string;
  assetType?: AssetType;
  department?: any;
  branch?: any;
  supplier?: Supplier;
  user?: any;
  parent?: Asset;
  components?: Asset[];
  movements?: any[];
  maintenances?: any[];
}

export interface AssetMovement {
  id: string;
  assetId: string;
  type: string;
  date: string;
  reason?: string;
  fromDepartment?: any;
  toDepartment?: any;
  fromBranch?: any;
  toBranch?: any;
  fromUser?: any;
  toUser?: any;
  registeredBy?: any;
  asset?: Asset;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: string;
  date: string;
  cost?: number;
  provider?: string;
  description: string;
  nextMaintenanceDate?: string;
  asset?: Asset;
}

// API Calls
export const getSuppliers = () => apiClient.get<Supplier[]>('/suppliers');
export const createSupplier = (data: Partial<Supplier>) => apiClient.post<Supplier>('/suppliers', data);
export const updateSupplier = (id: string, data: Partial<Supplier>) => apiClient.patch<Supplier>(`/suppliers/${id}`, data);
export const deleteSupplier = (id: string) => apiClient.delete(`/suppliers/${id}`);

export const getAssetTypes = () => apiClient.get<AssetType[]>('/asset-types');
export const createAssetType = (data: Partial<AssetType>) => apiClient.post<AssetType>('/asset-types', data);
export const updateAssetType = (id: string, data: Partial<AssetType>) => apiClient.patch<AssetType>(`/asset-types/${id}`, data);
export const deleteAssetType = (id: string) => apiClient.delete(`/asset-types/${id}`);

export const getAssets = (filters?: any) => apiClient.get<Asset[]>('/assets', filters);
export const getAsset = (id: string) => apiClient.get<Asset>(`/assets/${id}`);
export const createAsset = (data: Partial<Asset>) => apiClient.post<Asset>('/assets', data);
export const updateAsset = (id: string, data: Partial<Asset>) => apiClient.patch<Asset>(`/assets/${id}`, data);
export const deleteAsset = (id: string) => apiClient.delete(`/assets/${id}`);
export const getAssetDashboard = () => apiClient.get<any>('/assets/dashboard');

export const getAssetMovements = () => apiClient.get<AssetMovement[]>('/asset-movements');
export const createAssetMovement = (data: Partial<AssetMovement>) => apiClient.post<AssetMovement>('/asset-movements', data);

export const getAssetMaintenances = () => apiClient.get<AssetMaintenance[]>('/asset-maintenances');
export const createAssetMaintenance = (data: Partial<AssetMaintenance>) => apiClient.post<AssetMaintenance>('/asset-maintenances', data);