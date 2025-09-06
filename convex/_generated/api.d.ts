/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as http from "../http.js";
import type * as loyalty from "../loyalty.js";
import type * as notifications from "../notifications.js";
import type * as promotions from "../promotions.js";
import type * as providers from "../providers.js";
import type * as reviews from "../reviews.js";
import type * as router from "../router.js";
import type * as services from "../services.js";
import type * as userProfiles from "../userProfiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analytics: typeof analytics;
  auth: typeof auth;
  bookings: typeof bookings;
  http: typeof http;
  loyalty: typeof loyalty;
  notifications: typeof notifications;
  promotions: typeof promotions;
  providers: typeof providers;
  reviews: typeof reviews;
  router: typeof router;
  services: typeof services;
  userProfiles: typeof userProfiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
