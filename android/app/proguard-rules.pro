# Proguard rules for Android Release Build
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
