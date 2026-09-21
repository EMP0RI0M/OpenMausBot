package com.openmausbot.companion.expo

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Background Keep-Alive Foreground Service inspired by DSHA / DeepSeek Harness:
 * - Keeps CPU active via PARTIAL_WAKE_LOCK for long-running Antigravity (agy) agent tasks.
 * - Keeps WiFi socket alive via WIFI_MODE_FULL_HIGH_PERF.
 * - Avoids process death and freeze when device screen turns off or app is backgrounded.
 */
class HarnessKeepAliveService : Service() {

    companion object {
        const val ACTION_START = "com.openmausbot.companion.START_HARNESS"
        const val ACTION_STOP = "com.openmausbot.companion.STOP_HARNESS"
        private const val CHANNEL_ID = "openmausbot_harness_channel"
        private const val NOTIF_ID = 2001
        private var activeService: HarnessKeepAliveService? = null

        fun start(context: Context) {
            val intent = Intent(context, HarnessKeepAliveService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, HarnessKeepAliveService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    override fun onCreate() {
        super.onCreate()
        activeService = this
        createNotificationChannel()
        acquireLocks()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            releaseLocks()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        showForegroundNotification()
        return START_STICKY
    }

    private fun acquireLocks() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (pm != null && (wakeLock == null || !wakeLock!!.isHeld)) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "OpenMausBot:AgentHarness")
                wakeLock?.setReferenceCounted(false)
                wakeLock?.acquire(24 * 60 * 60 * 1000L) // 24 hours max safety timeout
            }

            val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            if (wm != null && (wifiLock == null || !wifiLock!!.isHeld)) {
                wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "OpenMausBot:WifiHarness")
                wifiLock?.setReferenceCounted(false)
                wifiLock?.acquire()
            }
        } catch (_: Throwable) {
        }
    }

    private fun releaseLocks() {
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
            if (wifiLock?.isHeld == true) wifiLock?.release()
        } catch (_: Throwable) {
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "OpenMausBot AI Agent Sandbox",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Runs local Linux sandbox & Antigravity agents in the background"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun showForegroundNotification() {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OpenMausBot Agent Engine Active")
            .setContentText("On-device Linux sandbox running Antigravity (agy)")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(NOTIF_ID, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseLocks()
        activeService = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
