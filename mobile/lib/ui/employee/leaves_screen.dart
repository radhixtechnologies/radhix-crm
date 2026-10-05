import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/leave_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/leave_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';
import 'apply_leave_dialog.dart';

class LeavesScreen extends StatefulWidget {
  const LeavesScreen({super.key});

  @override
  State<LeavesScreen> createState() => _LeavesScreenState();
}

class _LeavesScreenState extends State<LeavesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    final user = context.read<AuthProvider>().user;
    context.read<LeaveProvider>().fetchLeaves();
    context.read<LeaveProvider>().fetchBalance(user?.id);
  }

  @override
  Widget build(BuildContext context) {
    final leaveProvider = context.watch<LeaveProvider>();
    final leaves = leaveProvider.leaves;
    final balance = leaveProvider.balance;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Leave Management'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          showDialog(
            context: context,
            builder: (_) => const ApplyLeaveDialog(),
          );
        },
        icon: const Icon(Icons.add_rounded),
        label: const Text('Apply Leave'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance Cards Row
              Row(
                children: [
                  _buildBalanceCard('Casual', balance.casual.toStringAsFixed(0), const Color(0xFF3B82F6)),
                  const SizedBox(width: 8),
                  _buildBalanceCard('Sick', balance.sick.toStringAsFixed(0), const Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  _buildBalanceCard('Annual', balance.annual.toStringAsFixed(0), const Color(0xFF8B5CF6)),
                  const SizedBox(width: 8),
                  _buildBalanceCard('Used', balance.used.toStringAsFixed(0), const Color(0xFFF59E0B)),
                ],
              ),
              const SizedBox(height: 24),

              // Leave Applications List Header
              const Text(
                'Leave Requests',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              if (leaveProvider.isLoading && leaves.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (leaves.isEmpty)
                EmptyState(
                  icon: Icons.beach_access_rounded,
                  title: 'No Leave Requests',
                  message: 'You have not submitted any leave applications yet.',
                  actionText: 'Apply for Leave',
                  onAction: () {
                    showDialog(
                      context: context,
                      builder: (_) => const ApplyLeaveDialog(),
                    );
                  },
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: leaves.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = leaves[index];
                    return _buildLeaveCard(item);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveCard(LeaveModel item) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.beach_access_rounded, size: 18, color: AppColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${item.type[0].toUpperCase()}${item.type.substring(1)} Leave',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              StatusBadge(status: item.status),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${Formatters.formatDate(item.startDate)}  →  ${Formatters.formatDate(item.endDate)}  (${item.days} ${item.days == 1 ? "day" : "days"})',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            item.reason,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          if (item.rejectionReason != null && item.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.dangerBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Rejection Reason: ${item.rejectionReason}',
                style: const TextStyle(fontSize: 11, color: AppColors.danger, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
