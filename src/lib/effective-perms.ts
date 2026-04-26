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
  isPremium: boolean;
};
export function getEffectivePerms(profile: ProfilePerms | null | undefined): EffectivePerms {
  if (!profile) {
    return { isAdmin: false, isPremium: false };
  }
  // Non-admin: real permissions apply, test mode is ignored
  if (!profile.is_admin) {
    return {
      isAdmin: false,
      isPremium: profile.is_premium === true,
    };
  }
  // Admin: test mode determines effective perms
  const mode = profile.admin_test_mode;
  if (mode === "free") {
    return { isAdmin: false, isPremium: false };
  }
  if (mode === "premium") {
    return { isAdmin: false, isPremium: true };
  }
  // mode === 'admin' or null -> full admin
  return { isAdmin: true, isPremium: true };
}