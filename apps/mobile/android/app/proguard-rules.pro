# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep React Native native bridge classes and methods
-keep class com.facebook.react.** { *; }
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
   public <methods>;
   @com.facebook.react.bridge.ReactMethod *;
}
-keep class com.facebook.react.bridge.ReactApplicationContext { *; }
-keep class com.facebook.react.bridge.Promise { *; }

# Keep OpenMausBot custom native engine modules and services
-keep class com.openmausbot.companion.expo.** { *; }
-keepclassmembers class com.openmausbot.companion.expo.** {
    public <methods>;
    @com.facebook.react.bridge.ReactMethod *;
}
