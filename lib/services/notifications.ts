import { insforge } from "@/lib/insforge";

/**
 * Inserta una notificación en la tabla app_notifications.
 */
export async function sendAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    const { error } = await insforge.database
      .from("app_notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        is_read: false,
      });

    if (error) {
      console.error("[sendAppNotification] Error:", error);
    }
  } catch (err) {
    console.error("[sendAppNotification] Unexpected Error:", err);
  }
}

/**
 * Marca las notificaciones de un usuario como leídas.
 */
export async function markNotificationsAsRead(userId: string) {
  try {
    const { error } = await insforge.database
      .from("app_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[markNotificationsAsRead] Error:", error);
    }
  } catch (err) {
    console.error("[markNotificationsAsRead] Unexpected Error:", err);
  }
}
