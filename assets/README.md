# Assets

Add production assets here before making an EAS build. They are intentionally
omitted from the scaffold (Expo Go runs fine without them, using defaults).

Recommended files:

    assets/
      images/
        icon.png            # 1024x1024, no transparency (app icon)
        adaptive-icon.png   # 1024x1024 (Android adaptive foreground)
        splash.png          # ~1284x2778 (splash artwork)
        favicon.png         # 48x48 (web)
      fonts/                # custom fonts loaded via expo-font
      icons/                # in-app illustration assets

After adding `icon` / `splash` / `adaptiveIcon` files, re-add their paths to
`app.json` (`expo.icon`, `expo.splash.image`,
`expo.android.adaptiveIcon.foregroundImage`, `expo.web.favicon`).
