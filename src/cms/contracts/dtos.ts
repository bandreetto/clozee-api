export interface CMSAuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    role: {
      id: number;
      name: string;
      description: string;
      type: string;
    };
    created_at: Date;
    updated_at: Date;
  };
}

export interface StrapiImageDTO {
  id: number;
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: {
    thumbnail: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path?: string;
      size: number;
      width: number;
      height: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SearchCategoryDTO {
  id: number;
  title: string;
  searchTerm: string;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
  description?: string;
  image: StrapiImageDTO;
}

export interface EventDTO {
  id: number;
  title: string;
  banner: StrapiImageDTO;
  startAt: string;
  endAt: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  posts: { id: number; postId: string }[];
}

export interface TrendDTO {
  id: number;
  title: string;
  description: string;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}
