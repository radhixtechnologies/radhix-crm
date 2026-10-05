import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'Radhix CRM';
  static const String appVersion = '1.0.0';

  // Global key to display SnackBars reliably across dialogs and screens
  static final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();

  // Default Backend API URL
  // Can be switched to local development: http://10.0.2.2:5000/api (Android Emulator)
  // or http://localhost:5000/api (iOS Simulator)
  static const String defaultBaseUrl = 'https://radhix-crm.onrender.com/api';
  static const String localAndroidBaseUrl = 'http://10.0.2.2:5000/api';
  static const String localIosBaseUrl = 'http://localhost:5000/api';

  // SharedPreferences Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserData = 'user_data';
  static const String keyBaseUrl = 'custom_base_url';
  static const String keyRememberEmail = 'remember_email';
  static const String keyRememberMe = 'remember_me';

  // Timeouts - 60s to accommodate Render.com cold starts on free tier & mobile network latency
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
}

