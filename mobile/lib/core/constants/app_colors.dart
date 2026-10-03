import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFF4F46E5);      // Indigo 600
  static const Color primaryLight = Color(0xFF818CF8); // Indigo 400
  static const Color primaryDark = Color(0xFF3730A3);  // Indigo 800
  
  static const Color secondary = Color(0xFF06B6D4);    // Cyan 500
  static const Color secondaryDark = Color(0xFF0891B2);// Cyan 600

  // Background & Surfaces
  static const Color backgroundLight = Color(0xFFF8FAFC); // Slate 50
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceSubtle = Color(0xFFF1F5F9);   // Slate 100
  
  static const Color backgroundDark = Color(0xFF0B0F19);
  static const Color surfaceDark = Color(0xFF1E293B);      // Slate 800
  static const Color cardDark = Color(0xFF161F30);

  // Text Colors
  static const Color textPrimary = Color(0xFF0F172A);      // Slate 900
  static const Color textSecondary = Color(0xFF64748B);    // Slate 500
  static const Color textMuted = Color(0xFF94A3B8);        // Slate 400
  static const Color textLight = Color(0xFFF8FAFC);

  // Borders & Dividers
  static const Color borderLight = Color(0xFFE2E8F0);      // Slate 200
  static const Color borderDark = Color(0xFF334155);       // Slate 700

  // Status & Badges
  static const Color success = Color(0xFF10B981);          // Emerald 500
  static const Color successBg = Color(0xFFD1FAE5);        // Emerald 100
  static const Color warning = Color(0xFFF59E0B);          // Amber 500
  static const Color warningBg = Color(0xFFFEF3C7);        // Amber 100
  static const Color danger = Color(0xFFEF4444);           // Red 500
  static const Color dangerBg = Color(0xFFFEE2E2);         // Red 100
  static const Color info = Color(0xFF3B82F6);             // Blue 500
  static const Color infoBg = Color(0xFFDBEAFE);           // Blue 100
  static const Color purple = Color(0xFF8B5CF6);           // Purple 500
  static const Color purpleBg = Color(0xFFEDE9FE);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
