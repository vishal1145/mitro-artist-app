package com.mitro.artist

import android.app.Activity
import android.app.KeyguardManager
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import java.lang.ref.WeakReference

/**
 * Minimal native "incoming call" screen.
 *
 *  - ACTION_SHOW   : launched by the notification's full-screen intent (phone
 *                    locked / screen off) or a tap on the notification body.
 *                    Shows over the lock screen with Accept / Decline.
 *  - ACTION_ACCEPT : launched by the notification's Accept button. No UI - it
 *                    stops the ring and hands off to the app immediately.
 *
 * Accept -> deep link into the app's existing accept flow
 *           (mitroartist://incoming-call-request?...&auto=accept).
 * Decline -> existing reject API via a headless JS task.
 */
class IncomingCallActivity : Activity() {

    companion object {
        private val live = mutableMapOf<String, WeakReference<Activity>>()

        fun finishFor(requestId: String) {
            live.remove(requestId)?.get()?.finish()
        }

        fun finishAll() {
            live.values.toList().forEach { it.get()?.finish() }
            live.clear()
        }
    }

    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val call = IncomingCall.from(intent)
        if (call == null) {
            finish()
            return
        }
        showOverLockScreen()

        if (intent.getStringExtra(IncomingCallNotifier.EXTRA_ACTION) == IncomingCallNotifier.ACTION_ACCEPT) {
            accept(call)
            return
        }

        live[call.requestId] = WeakReference(this)
        setContentView(buildUi(call))
        handler.postDelayed({ finish() }, call.ttlMs)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    private fun showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun accept(call: IncomingCall) {
        // Unregister first so cancel() below doesn't finish us before the hand-off.
        live.remove(call.requestId)
        IncomingCallNotifier.cancel(applicationContext, call.requestId)

        val launch = {
            val open = Intent(Intent.ACTION_VIEW, call.deepLink("accept"))
                .setPackage(packageName)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(open)
            finish()
        }

        val km = getSystemService(KeyguardManager::class.java)
        if (km != null && km.isKeyguardLocked && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            km.requestDismissKeyguard(
                this,
                object : KeyguardManager.KeyguardDismissCallback() {
                    override fun onDismissSucceeded() = launch()
                    override fun onDismissCancelled() = finish()
                    override fun onDismissError() = launch()
                },
            )
        } else {
            launch()
        }
    }

    // ---- programmatic UI (no XML resources to generate / keep in sync) ----

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun label(text: String, sp: Float, color: Int, bold: Boolean = false): TextView =
        TextView(this).apply {
            this.text = text
            textSize = sp
            setTextColor(color)
            gravity = Gravity.CENTER
            if (bold) typeface = Typeface.DEFAULT_BOLD
        }

    private fun pill(text: String, color: Int, onClick: () -> Unit): TextView =
        label(text, 17f, Color.WHITE, bold = true).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(32).toFloat()
                setColor(color)
            }
            setPadding(dp(8), dp(16), dp(8), dp(16))
            setOnClickListener { onClick() }
        }

    private fun buildUi(call: IncomingCall): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.parseColor("#05040B"))
            setPadding(dp(24), dp(80), dp(24), dp(48))
        }

        root.addView(label("Incoming private call", 16f, Color.parseColor("#B8B4C8")))

        val avatar = label(call.userName.take(1).uppercase(), 40f, Color.WHITE, bold = true).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#FF3FAD"))
            }
        }
        root.addView(avatar, LinearLayout.LayoutParams(dp(112), dp(112)).apply { topMargin = dp(40) })

        root.addView(
            label(call.userName, 28f, Color.WHITE, bold = true),
            LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(24) },
        )
        if (!call.message.isNullOrBlank()) {
            root.addView(
                label("“${call.message}”", 15f, Color.parseColor("#B8B4C8")),
                LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(12) },
            )
        }
        root.addView(
            label("${call.initialCharge} coins for the first 5 minutes (${call.pricePerMinute}/min after)", 14f, Color.parseColor("#F5C451")),
            LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(16) },
        )

        root.addView(View(this), LinearLayout.LayoutParams(0, 0, 1f))

        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val decline = pill("Decline", Color.parseColor("#E5484D")) {
            IncomingCallActionReceiver.decline(applicationContext, call.requestId)
            finish()
        }
        val accept = pill("Accept", Color.parseColor("#2FBF71")) { accept(call) }
        row.addView(decline, LinearLayout.LayoutParams(0, -2, 1f).apply { marginEnd = dp(8) })
        row.addView(accept, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = dp(8) })
        root.addView(row, LinearLayout.LayoutParams(-1, -2))

        return root
    }
}
