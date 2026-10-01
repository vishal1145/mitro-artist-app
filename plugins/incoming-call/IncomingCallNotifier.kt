package com.mitro.artist

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * A private-call request pushed by the backend as an FCM *data* message
 * (type = "private_call_request"). Everything the native ring needs travels in
 * the payload, because the JS engine may not be running.
 */
data class IncomingCall(
    val requestId: String,
    val userName: String,
    val userPhotoUrl: String?,
    val pricePerMinute: String,
    val initialCharge: String,
    val message: String?,
    /** ISO-8601, always with a trailing Z, fraction trimmed to 3 digits (JS-safe). */
    val expiresAtUtc: String?,
    /** How long to ring, in ms (capped to the backend's request expiry). */
    val ttlMs: Long,
) {
    fun writeTo(intent: Intent): Intent = intent.apply {
        putExtra("requestId", requestId)
        putExtra("userName", userName)
        putExtra("userPhotoUrl", userPhotoUrl)
        putExtra("pricePerMinute", pricePerMinute)
        putExtra("initialCharge", initialCharge)
        putExtra("message", message)
        putExtra("expiresAtUtc", expiresAtUtc)
        putExtra("ttlMs", ttlMs)
    }

    /** Deep link into the existing Artist-app modal (app/(app)/(modals)/incoming-call-request). */
    fun deepLink(auto: String?): Uri {
        val b = Uri.Builder()
            .scheme("mitroartist")
            .authority("incoming-call-request")
            .appendQueryParameter("requestId", requestId)
            .appendQueryParameter("fan", userName)
            .appendQueryParameter("pricePerMinute", pricePerMinute)
            .appendQueryParameter("initialCharge", initialCharge)
        if (!message.isNullOrBlank()) b.appendQueryParameter("message", message)
        if (!expiresAtUtc.isNullOrBlank()) b.appendQueryParameter("expiresAt", expiresAtUtc)
        if (auto != null) b.appendQueryParameter("auto", auto)
        return b.build()
    }

    companion object {
        fun from(intent: Intent): IncomingCall? {
            val id = intent.getStringExtra("requestId") ?: return null
            return IncomingCall(
                requestId = id,
                userName = intent.getStringExtra("userName") ?: "Someone",
                userPhotoUrl = intent.getStringExtra("userPhotoUrl"),
                pricePerMinute = intent.getStringExtra("pricePerMinute") ?: "0",
                initialCharge = intent.getStringExtra("initialCharge") ?: "0",
                message = intent.getStringExtra("message"),
                expiresAtUtc = intent.getStringExtra("expiresAtUtc"),
                ttlMs = intent.getLongExtra("ttlMs", IncomingCallNotifier.MAX_TTL_MS),
            )
        }

        fun fromData(data: Map<String, String>): IncomingCall? {
            val id = data["requestId"]?.takeIf { it.isNotBlank() } ?: return null
            val expires = normalizeIso(data["expiresAtUtc"])
            return IncomingCall(
                requestId = id,
                userName = data["userName"]?.takeIf { it.isNotBlank() } ?: "A fan",
                userPhotoUrl = data["userPhotoUrl"]?.takeIf { it.isNotBlank() },
                pricePerMinute = data["pricePerMinute"] ?: "0",
                initialCharge = data["initialCharge"] ?: "0",
                message = data["message"]?.takeIf { it.isNotBlank() },
                expiresAtUtc = expires,
                ttlMs = computeTtlMs(expires),
            )
        }

        private fun normalizeIso(raw: String?): String? {
            if (raw.isNullOrBlank()) return null
            var s = raw.trim()
            s = Regex("(\\.\\d{3})\\d+").replace(s, "$1")
            if (!s.endsWith("Z") && !Regex("[+-]\\d{2}:?\\d{2}$").containsMatchIn(s)) s += "Z"
            return s
        }

        private fun computeTtlMs(iso: String?): Long {
            if (iso == null || iso.length < 19) return IncomingCallNotifier.MAX_TTL_MS
            return try {
                val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
                fmt.timeZone = TimeZone.getTimeZone("UTC")
                val expiresAt = fmt.parse(iso.substring(0, 19))?.time ?: return IncomingCallNotifier.MAX_TTL_MS
                (expiresAt - System.currentTimeMillis())
                    .coerceIn(IncomingCallNotifier.MIN_TTL_MS, IncomingCallNotifier.MAX_TTL_MS)
            } catch (e: Exception) {
                IncomingCallNotifier.MAX_TTL_MS
            }
        }
    }
}

object IncomingCallNotifier {
    const val CHANNEL_ID = "incoming_calls_v1"
    const val EXTRA_ACTION = "ic_action"
    const val ACTION_SHOW = "show"
    const val ACTION_ACCEPT = "accept"

    /** Backend PrivateCallService.RequestExpiry = 60s. */
    const val MAX_TTL_MS = 60_000L

    /** Floor, so a skewed device clock can't make the ring vanish instantly. */
    const val MIN_TTL_MS = 15_000L

    private const val TAG = "IncomingCall"

    fun notificationId(requestId: String): Int = requestId.hashCode()

    /** Channel sound/vibration are frozen after creation, hence the versioned id. */
    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(CHANNEL_ID, "Incoming calls", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Rings when a fan requests a private call"
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIC)
                    .build(),
            )
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 800, 600, 800, 600)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setShowBadge(false)
        }
        nm.createNotificationChannel(channel)
    }

    private fun activityIntent(ctx: Context, call: IncomingCall, action: String): Intent =
        call.writeTo(Intent(ctx, IncomingCallActivity::class.java)).apply {
            putExtra(EXTRA_ACTION, action)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

    private fun piFlags(): Int =
        PendingIntent.FLAG_UPDATE_CURRENT or
            (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)

    fun show(ctx: Context, call: IncomingCall) {
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        if (!nm.areNotificationsEnabled()) {
            Log.w(TAG, "Notifications are disabled - cannot ring for ${call.requestId}")
            return
        }
        ensureChannel(ctx)

        // FCM can redeliver; don't restart the ring for a request already ringing.
        val id = notificationId(call.requestId)
        if (nm.activeNotifications.any { it.id == id }) return

        val showPi = PendingIntent.getActivity(ctx, id, activityIntent(ctx, call, ACTION_SHOW), piFlags())
        val acceptPi = PendingIntent.getActivity(ctx, id + 1, activityIntent(ctx, call, ACTION_ACCEPT), piFlags())
        val declinePi = PendingIntent.getBroadcast(
            ctx,
            id + 2,
            Intent(ctx, IncomingCallActionReceiver::class.java).apply {
                action = "com.mitro.artist.INCOMING_CALL_DECLINE"
                putExtra("requestId", call.requestId)
            },
            piFlags(),
        )

        val person = Person.Builder().setName(call.userName).setImportant(true).apply {
            fetchPhoto(call.userPhotoUrl)?.let { setIcon(IconCompat.createWithBitmap(it)) }
        }.build()

        val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        val builder = NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle(call.userName)
            .setContentText("Incoming private call · ${call.initialCharge} coins")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(false)
            .setTimeoutAfter(call.ttlMs)
            .setContentIntent(showPi)
            .setFullScreenIntent(showPi, true)
            .setSound(ringtone, AudioManager.STREAM_RING)
            .setVibrate(longArrayOf(0, 800, 600, 800, 600))
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(person, declinePi, acceptPi))

        val notification = builder.build()
        // Loop the ringtone + vibration until the notification is cancelled / times out.
        notification.flags = notification.flags or Notification.FLAG_INSISTENT
        nm.notify(id, notification)
    }

    /** Stop the ring + remove the notification + close the lock-screen UI. */
    fun cancel(ctx: Context, requestId: String) {
        ctx.getSystemService(NotificationManager::class.java)?.cancel(notificationId(requestId))
        IncomingCallActivity.finishFor(requestId)
    }

    fun cancelAll(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        try {
            nm.activeNotifications
                .filter { Build.VERSION.SDK_INT < Build.VERSION_CODES.O || it.notification.channelId == CHANNEL_ID }
                .forEach { nm.cancel(it.id) }
        } catch (e: Exception) {
            Log.w(TAG, "cancelAll failed", e)
        }
        IncomingCallActivity.finishAll()
    }

    /** Best-effort avatar fetch (2s budget) - never blocks the ring on a slow CDN. */
    private fun fetchPhoto(url: String?): Bitmap? {
        if (url.isNullOrBlank() || !url.startsWith("https://")) return null
        return try {
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.connectTimeout = 2000
            conn.readTimeout = 2000
            conn.inputStream.use { BitmapFactory.decodeStream(it) }
        } catch (e: Exception) {
            null
        }
    }
}
