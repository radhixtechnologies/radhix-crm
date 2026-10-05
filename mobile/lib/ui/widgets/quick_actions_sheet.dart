import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../employee/apply_leave_dialog.dart';
import '../finance/salary_slips_screen.dart';
import '../sales/add_lead_screen.dart';
import 'logout_dialog.dart';

class QuickActionsSheet extends StatelessWidget {
  final Function(int)? onNavigateTab;

  const QuickActionsSheet({super.key, this.onNavigateTab});

  static void show(BuildContext context, {Function(int)? onNavigateTab}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => QuickActionsSheet(onNavigateTab: onNavigateTab),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isSales = user?.isSalesDepartment ?? false;

    final actions = [
      if (isSales)
        _ActionItem(
          label: 'Add Lead',
          icon: Icons.person_add_alt_1_rounded,
          color: const Color(0xFF06B6D4),
          onTap: () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AddLeadScreen()),
            );
          },
        ),
      _ActionItem(
        label: 'Punch In / Out',
        icon: Icons.fingerprint_rounded,
        color: const Color(0xFF10B981),
        onTap: () {
          Navigator.pop(context);
          onNavigateTab?.call(isSales ? 2 : 1);
        },
      ),
      _ActionItem(
        label: 'Salary Slips',
        icon: Icons.receipt_long_rounded,
        color: const Color(0xFF0284C7),
        onTap: () {
          Navigator.pop(context);
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SalarySlipsScreen()),
          );
        },
      ),
      _ActionItem(
        label: 'Apply Leave',
        icon: Icons.beach_access_rounded,
        color: const Color(0xFFF59E0B),
        onTap: () {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => const ApplyLeaveDialog(),
          );
        },
      ),
      _ActionItem(
        label: 'Create Task',
        icon: Icons.task_alt_rounded,
        color: const Color(0xFF8B5CF6),
        onTap: () {
          Navigator.pop(context);
          onNavigateTab?.call(isSales ? 3 : 2);
        },
      ),
      _ActionItem(
        label: 'Log Out',
        icon: Icons.logout_rounded,
        color: const Color(0xFFDC2626),
        onTap: () {
          final rootCtx = Navigator.of(context, rootNavigator: true).context;
          Navigator.pop(context);
          LogoutDialog.show(rootCtx);
        },
      ),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.only(top: 16, left: 20, right: 20, bottom: 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.bolt_rounded, color: AppColors.primary, size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Quick Actions',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: actions.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 0.95,
            ),
            itemBuilder: (context, index) {
              final action = actions[index];
              return InkWell(
                onTap: action.onTap,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: action.color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: action.color.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: action.color.withValues(alpha: 0.16),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(action.icon, color: action.color, size: 22),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        action.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: action.color,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ActionItem {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  _ActionItem({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}
