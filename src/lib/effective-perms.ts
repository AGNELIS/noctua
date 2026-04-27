// effective-perms.ts
//
// Translates raw profile fields into effective permissions, accounting for
// admin_test_mode. Use this everywhere instead of reading is_premium/is_admin
// directly, so admins can test the app as free or premium users without
// changing their database row.
//
// For non-admin users, this is a no-op: their real permissions apply.
// For admins, admin_test_mode determines what they see:
//   null      -> full admin (default)
//   'admin'   -> full admin (same as null, explicit choice)
//   'premium' -> behaves as a premium user (no admin overrides)
//   'free'    -> behaves as a free user (no premium, no admin)
export type ProfilePerms = {
  is_admin?: boolean | null;
  is_premium?: boolean | null;
  admin_test_mode?: string | null;
};
export type EffectivePerms = {
  isAdmin: boolean;
  isAdminUser: boolean;
  isPremium: boolean;
};
export function getEffectivePerms(profile: ProfilePerms | null | undefined): EffectivePerms {
  if (!profile) {
    return { isAdmin: false, isAdminUser: false, isPremium: false };
  }
  // Non-admin: real permissions apply, test mode is ignored
  if (!profile.is_admin) {
    return {
      isAdmin: false,
      isAdminUser: false,
      isPremium: profile.is_premium === true,
    };
  }
  // Admin: test mode determines effective perms
  const mode = profile.admin_test_mode;
  if (mode === "free") {
    return { isAdmin: false, isAdminUser: true, isPremium: false };
  }
  if (mode === "premium") {
    return { isAdmin: false, isAdminUser: true, isPremium: true };
  }
  // mode === 'admin' or null -> full admin
  return { isAdmin: true, isAdminUser: true, isPremium: true };
}