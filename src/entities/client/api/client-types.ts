export type Client = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  clientStatusId?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientListParams = {
  search?: string;
  clientStatusId?: number;
};

export type CreateClientDto = {
  name: string;
  phone: string;
  email?: string;
  clientStatusId?: number;
  isActive?: boolean;
};

export type UpdateClientDto = {
  name?: string;
  phone?: string;
  email?: string;
  clientStatusId?: number;
  isActive?: boolean;
};

