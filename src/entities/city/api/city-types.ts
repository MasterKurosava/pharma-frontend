export type City = {
  id: number;
  name: string;
  countryId: number;
  isActive: boolean;
};

export type CityListParams = {
  search?: string;
  countryId?: number;
  isActive?: boolean;
};

export type CreateCityDto = {
  name: string;
  countryId: number;
  isActive?: boolean;
};

export type UpdateCityDto = {
  name?: string;
  countryId?: number;
  isActive?: boolean;
};

