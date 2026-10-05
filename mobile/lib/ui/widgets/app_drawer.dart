import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/auth_provider.dart';
import '../profile/server_settings_dialog.dart';
import 'logout_dialog.dart';
import 'status_badge.dart';

class AppDrawer extends StatelessWidget {
  final int currentIndex;
  final Function(int) onSelectTab;

  const AppDrawer({
    super.key,
    required this.currentIndex,
    required this.onSelectTab,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // Header
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 18,
              left: 20,
              right: 20,
              bottom: 20,
            ),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // App Logo and Name
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.business_rounded, color: AppColors.primary, size: 20),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      AppConstants.appName,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // User Info Row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.white,
                      child: Text(
                        user != null && user.name.isNotEmpty
                            ? user.name[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'User',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? '',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.8),
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          StatusBadge(
                            status: (user?.department != null && user!.department.isNotEmpty)
                                ? user.department
                                : (user?.role ?? 'employee'),
                            fontSize: 10,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Menu List
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildDrawerItem(
                  context,
                  icon: Icons.dashboard_rounded,
                  title: 'Dashboard',
                  index: 0,
                ),
                if (user?.isSalesDepartment ?? false) ...[
                  _buildDrawerItem(
                    context,
                    icon: Icons.trending_up_rounded,
                    title: 'Sales & Leads',
                    index: 1,
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.fingerprint_rounded,
                    title: 'My Attendance',
                    index: 2,
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.assignment_turned_in_rounded,
                    title: 'Tasks',
                    index: 3,
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.receipt_long_rounded,
                    title: 'Salary Slips',
                    index: 4,
                  ),
                ] else ...[
                  _buildDrawerItem(
                    context,
                    icon: Icons.fingerprint_rounded,
                    title: 'My Attendance',
                    index: 1,
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.assignment_turned_in_rounded,
                    title: 'Tasks',
                    index: 2,
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.receipt_long_rounded,
                    title: 'Salary Slips',
                    index: 3,
                  ),
                ],
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Divider(),
                ),
                ListTile(
                  leading: const Icon(Icons.settings_outlined, color: AppColors.textSecondary),
                  title: const Text(
                    'Server & API Settings',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    showDialog(
                      context: context,
                      builder: (ctx) => const ServerSettingsDialog(),
                    );
                  },
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
                  ),
                  title: const Text(
                    'Log Out / Switch ID',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.danger),
                  ),
                  subtitle: const Text(
                    'Sign in with another account',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                  onTap: () {
                    final rootCtx = Navigator.of(context, rootNavigator: true).context;
                    Navigator.pop(context);
                    LogoutDialog.show(rootCtx);
                  },
                ),
              ],
            ),
          ),

          // Footer
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.shield_outlined, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  '${AppConstants.appName} v${AppConstants.appVersion}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required int index,
  }) {
    final isSelected = currentIndex == index;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        selected: isSelected,
        selectedTileColor: AppColors.primary.withValues(alpha: 0.08),
        leading: Icon(
          icon,
          color: isSelected ? AppColors.primary : AppColors.textSecondary,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
        onTap: () {
          Navigator.pop(context);
          onSelectTab(index);
        },
      ),
    );
  }
}
