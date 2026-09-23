export type RewardRow = {
  /** A string id is the row's server-assigned id (existing reward); a number
   *  is a local `Date.now()` temp id for a not-yet-saved draft row. */
  id: string | number;
  name: string;
  price: string;
  isActive: boolean;
};

export type Slice = {
  id: string;
  activityName: string;
  weight: string;
  isNew: boolean;
};
