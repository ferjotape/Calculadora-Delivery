export type FixedCost = {
  name: string;
  value: number;
};

export type Profile = {
  id: string;
  restaurant_name: string | null;
  created_at: string;
};

export type CostSettings = {
  id: string;
  user_id: string;
  fixed_costs: FixedCost[];
  card_fee_pct: number;
  packaging_pct: number;
  free_delivery_pct: number;
  desired_profit_pct: number;
  avg_monthly_revenue: number | null;
  updated_at: string;
};

export type DeliveryPlatform = {
  id: string;
  user_id: string;
  name: string;
  fee_pct: number;
  is_active: boolean;
};

export type Ingredient = {
  id: string;
  user_id: string;
  code: number | null;
  name: string;
  price_paid: number;
  purchase_volume: number;
  unit: string;
  correction_factor: number;
  unit_cost: number;
  created_at: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  loss_pct: number;
  discount_pct: number;
  practiced_price: number | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity_used: number;
};

export type RecipePlatformPrice = {
  id: string;
  recipe_id: string;
  platform_id: string;
  suggested_price: number | null;
  price_with_discount: number | null;
  profit_pct: number | null;
  profit_value: number | null;
  cmv_pct: number | null;
  calculated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      cost_settings: {
        Row: CostSettings;
        Insert: Partial<CostSettings> & { user_id: string };
        Update: Partial<CostSettings>;
        Relationships: [];
      };
      delivery_platforms: {
        Row: DeliveryPlatform;
        Insert: Partial<DeliveryPlatform> & { user_id: string; name: string; fee_pct: number };
        Update: Partial<DeliveryPlatform>;
        Relationships: [];
      };
      ingredients: {
        Row: Ingredient;
        Insert: Partial<Ingredient> & {
          user_id: string;
          name: string;
          price_paid: number;
          purchase_volume: number;
          unit: string;
        };
        Update: Partial<Ingredient>;
        Relationships: [];
      };
      recipes: {
        Row: Recipe;
        Insert: Partial<Recipe> & { user_id: string; name: string };
        Update: Partial<Recipe>;
        Relationships: [];
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Partial<RecipeIngredient> & {
          recipe_id: string;
          ingredient_id: string;
          quantity_used: number;
        };
        Update: Partial<RecipeIngredient>;
        Relationships: [];
      };
      recipe_platform_prices: {
        Row: RecipePlatformPrice;
        Insert: Partial<RecipePlatformPrice> & { recipe_id: string; platform_id: string };
        Update: Partial<RecipePlatformPrice>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
