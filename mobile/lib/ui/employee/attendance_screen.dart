import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/attendance_model.dart';
import '../../providers/attendance_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _isPunching = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    context.read<AttendanceProvider>().fetchTodayStatus();
    context.read<AttendanceProvider>().fetchHistory();
  }

  @override
  Widget build(BuildContext context) {
    final attendance = context.watch<AttendanceProvider>();
    final today = attendance.todayStatus;
    final history = attendance.history;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('My Attendance'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
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
              // Big Punch In/Out Card
              _buildPunchCard(context, today, attendance),
              const SizedBox(height: 24),

              // Attendance History Header
              const Text(
                'Recent Attendance Records',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              // History List
              if (attendance.isLoading && history.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (history.isEmpty)
                const EmptyState(
                  icon: Icons.history_rounded,
                  title: 'No Records Yet',
                  message: 'Your punch-in and attendance history will be listed here.',
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: history.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = history[index];
                    return _buildHistoryItem(item);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPunchCard(
    BuildContext context,
    TodayAttendanceStatus today,
    AttendanceProvider attendance,
  ) {
    final isCheckedIn = today.isCheckedIn;
    final isCheckedOut = today.isCheckedOut;
    final isBusy = _isPunching || attendance.isLoading;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Date Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Today',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    Formatters.formatDate(DateTime.now()),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              StatusBadge(
                status: isCheckedOut ? 'Completed' : (isCheckedIn ? 'Present' : 'Not Punched'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Big Circular Punch Button
          Center(
            child: InkWell(
              borderRadius: BorderRadius.circular(100),
              onTap: (isBusy || isCheckedOut)
                  ? null
                  : () async {
                      setState(() => _isPunching = true);
                      try {
                        if (!isCheckedIn) {
                          final ok = await attendance.punchCheckIn();
                          if (ok && mounted) {
                            ToastUtil.showSuccess(null, 'Punched In Successfully!');
                          } else if (mounted) {
                            ToastUtil.showError(
                              null,
                              attendance.errorMessage ?? 'Failed to punch in. Please check connection.',
                            );
                          }
                        } else {
                          final ok = await attendance.punchCheckOut();
                          if (ok && mounted) {
                            ToastUtil.showSuccess(null, 'Punched Out Successfully!');
                          } else if (mounted) {
                            ToastUtil.showError(
                              null,
                              attendance.errorMessage ?? 'Failed to punch out. Please check connection.',
                            );
                          }
                        }
                      } finally {
                        if (mounted) {
                          setState(() => _isPunching = false);
                        }
                      }
                    },
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: isCheckedOut
                      ? null
                      : (!isCheckedIn
                          ? AppColors.primaryGradient
                          : const LinearGradient(
                              colors: [Color(0xFFEF4444), Color(0xFFF97316)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )),
                  color: isCheckedOut ? Colors.grey.shade200 : null,
                  boxShadow: isCheckedOut
                      ? []
                      : [
                          BoxShadow(
                            color: (!isCheckedIn ? AppColors.primary : const Color(0xFFEF4444)).withValues(alpha: 0.35),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                ),
                child: isBusy
                    ? const Center(
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isCheckedOut
                                ? Icons.check_circle_rounded
                                : (isCheckedIn ? Icons.timer_off_rounded : Icons.fingerprint_rounded),
                            size: 44,
                            color: isCheckedOut ? Colors.grey : Colors.white,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isCheckedOut
                                ? 'Shift Ended'
                                : (isCheckedIn ? 'Punch Out' : 'Punch In'),
                            style: TextStyle(
                              color: isCheckedOut ? Colors.grey.shade700 : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          if (isCheckedIn && !isCheckedOut)
                            const Text(
                              'Shift Active',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                        ],
                      ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Punch in/out metrics
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surfaceSubtle,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildMetricCol('Punch In', Formatters.formatTime(today.checkInTime)),
                const SizedBox(
                  height: 30,
                  child: VerticalDivider(color: AppColors.borderLight, thickness: 1),
                ),
                _buildMetricCol(
                  'Punch Out',
                  today.checkOutTime != null
                      ? Formatters.formatTime(today.checkOutTime)
                      : (today.isCheckedIn ? 'Working...' : '--:--'),
                ),
                const SizedBox(
                  height: 30,
                  child: VerticalDivider(color: AppColors.borderLight, thickness: 1),
                ),
                _buildMetricCol('Hours', '${today.activeHoursWorked.toStringAsFixed(1)} hrs'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  Widget _buildHistoryItem(AttendanceModel item) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Formatters.formatDate(item.date),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'In: ${Formatters.formatTime(item.checkIn)}  •  Out: ${Formatters.formatTime(item.checkOut)}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              StatusBadge(status: item.status),
              const SizedBox(height: 4),
              Text(
                '${item.hoursWorked} hrs',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
