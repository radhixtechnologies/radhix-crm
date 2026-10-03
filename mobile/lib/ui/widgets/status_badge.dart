import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  });

  @override
  Widget build(BuildContext context) {
    final s = status.toLowerCase().replaceAll('-', '_');
    Color textColor;
    Color bgColor;

    switch (s) {
      case 'new':
      case 'created':
        textColor = const Color(0xFF2563EB); // Blue
        bgColor = const Color(0xFFEFF6FF);
        break;
      case 'contacted':
      case 'in_progress':
      case 'sent':
        textColor = const Color(0xFF7C3AED); // Purple
        bgColor = const Color(0xFFF5F3FF);
        break;
      case 'qualified':
      case 'approved':
      case 'approved_by_admin':
      case 'converted':
      case 'paid':
      case 'present':
        textColor = const Color(0xFF059669); // Emerald
        bgColor = const Color(0xFFECFDF5);
        break;
      case 'pending':
      case 'submitted_for_approval':
      case 'partially_paid':
      case 'wfh':
        textColor = const Color(0xFFD97706); // Amber
        bgColor = const Color(0xFFFFFBEB);
        break;
      case 'lost':
      case 'rejected':
      case 'rejected_by_admin':
      case 'cancelled':
      case 'overdue':
      case 'absent':
        textColor = const Color(0xFFDC2626); // Red
        bgColor = const Color(0xFFFEF2F2);
        break;
      case 'hot':
        textColor = const Color(0xFFEA580C); // Orange
        bgColor = const Color(0xFFFFF7ED);
        break;
      case 'warm':
        textColor = const Color(0xFFCA8A04); // Yellow
        bgColor = const Color(0xFFFEFCE8);
        break;
      case 'cold':
        textColor = const Color(0xFF0284C7); // Sky
        bgColor = const Color(0xFFF0F9FF);
        break;
      default:
        textColor = AppColors.textSecondary;
        bgColor = AppColors.surfaceSubtle;
    }

    final displayText = status.isEmpty
        ? 'Unknown'
        : status[0].toUpperCase() + status.substring(1).replaceAll('-', ' ').replaceAll('_', ' ');

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.2), width: 1),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
