package com.mitro.artist

import android.app.ActivityManager
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

/**
 * Replaces React Native Firebase's FirebaseMessagingService (declared with a
 * higher intent-filter priority in the manifest by the config plugin). It
 * extends the RNFB service, so every other push keeps working untouched.
 *
 * Handles two *data-only, high-priority* messages from the backend:
 *   private_call_request         -> ring (CallStyle + full-screen intent)
 *   private_call_request_closed  -> stop ringing (cancelled / expired / handled)
 */
class IncomingCallMessagingService : ReactNativeFirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        try {
            when (data["type"]) {
                "private_call_request" -> {
                    // Foreground: the in-app overlay is the one and only ringer.
                    if (!isAppInForeground()) {
                        IncomingCall.fromData(data)?.let { IncomingCallNotifier.show(applicationContext, it) }
                    }
                }
                "private_call_request_closed" -> {
                    data["requestId"]?.let { IncomingCallNotifier.cancel(applicationContext, it) }
                }
            }
        } catch (e: Exception) {
            Log.e("IncomingCall", "Failed to handle call push", e)
        }
        super.onMessageReceived(message)
    }

    private fun isAppInForeground(): Boolean {
        val am = getSystemService(ACTIVITY_SERVICE) as? ActivityManager ?: return false
        val procs = am.runningAppProcesses ?: return false
        return procs.any {
            it.processName == packageName &&
                it.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        }
    }
}
