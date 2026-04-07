import { SupabaseClient } from "@supabase/supabase-js";

type NotifyParams = {
  userId: string;
  type: string;
  titleEn: string;
  titlePl: string;
  bodyEn?: string;
  bodyPl?: string;
  link?: string;
};

export async function sendNotification(supabase: SupabaseClient, params: NotifyParams) {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title_en: params.titleEn,
    title_pl: params.titlePl,
    body_en: params.bodyEn || null,
    body_pl: params.bodyPl || null,
    link: params.link || null,
  });
}