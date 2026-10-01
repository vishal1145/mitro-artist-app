package com.mitro.artist

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/** Runs the JS task "IncomingCallDecline" (registered in index.js). */
class IncomingCallHeadlessService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras ?: return null
        return HeadlessJsTaskConfig(
            "IncomingCallDecline",
            Arguments.fromBundle(extras),
            20_000,
            true,
        )
    }
}
