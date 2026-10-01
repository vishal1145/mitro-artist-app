package com.mitro.artist

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.HeadlessJsTaskService

/**
 * "Decline" tapped on the call notification (or the lock-screen UI): stop the
 * ring immediately, then run the existing reject API through a headless JS task
 * so it works even when the app is killed.
 */
class IncomingCallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val requestId = intent.getStringExtra("requestId") ?: return
        decline(context, requestId)
    }

    companion object {
        fun decline(context: Context, requestId: String) {
            IncomingCallNotifier.cancel(context, requestId)
            try {
                val svc = Intent(context, IncomingCallHeadlessService::class.java)
                    .putExtra("requestId", requestId)
                context.startService(svc)
                HeadlessJsTaskService.acquireWakeLockNow(context)
            } catch (e: Exception) {
                // Worst case the request simply auto-expires on the backend (60s).
                Log.w("IncomingCall", "Could not start decline task for $requestId", e)
            }
        }
    }
}
