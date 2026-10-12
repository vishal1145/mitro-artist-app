package com.mitro.artist

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

/** JS bridge: NativeModules.IncomingCall */
class IncomingCallModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

    override fun getName(): String = "IncomingCall"

    private var ringtone: Ringtone? = null

    /** Looping system ringtone for the in-app (foreground) incoming-call dialog.
     *  Uses the ringtone audio usage, so silent / vibrate-only modes are respected. */
    @ReactMethod
    fun startRingtone() {
        try {
            stopRingtoneInternal()
            val uri = RingtoneManager.getActualDefaultRingtoneUri(ctx, RingtoneManager.TYPE_RINGTONE)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            val r = RingtoneManager.getRingtone(ctx, uri) ?: return
            r.audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            if (Build.VERSION.SDK_INT >= 28) r.isLooping = true
            r.play()
            ringtone = r
        } catch (e: Exception) {
            // best effort - vibration still runs from JS
        }
    }

    @ReactMethod
    fun stopRingtone() {
        stopRingtoneInternal()
    }

    private fun stopRingtoneInternal() {
        try { ringtone?.stop() } catch (e: Exception) {}
        ringtone = null
    }

    override fun invalidate() {
        stopRingtoneInternal()
        super.invalidate()
    }

    /** Android 14+ can revoke USE_FULL_SCREEN_INTENT; below 14 it is always granted. */
    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < 34) {
                promise.resolve(true)
            } else {
                val nm = ctx.getSystemService(NotificationManager::class.java)
                promise.resolve(nm?.canUseFullScreenIntent() ?: true)
            }
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT < 34) return
        val intent = Intent(
            Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
            Uri.parse("package:${ctx.packageName}"),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            ctx.startActivity(intent)
        } catch (e: Exception) {
            ctx.startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
        }
    }

    @ReactMethod
    fun cancel(requestId: String) {
        IncomingCallNotifier.cancel(ctx, requestId)
    }

    /** Stop every native ring (the app just came to the foreground - the in-app overlay takes over). */
    @ReactMethod
    fun cancelAll() {
        IncomingCallNotifier.cancelAll(ctx)
    }
}

class IncomingCallPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(IncomingCallModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
