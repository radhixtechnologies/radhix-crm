import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/dashboard_stats_model.dart';
import '../../data/models/task_model.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/leave_provider.dart';
import '../../providers/task_provider.dart';
import '../../data/models/salary_slip_model.dart';
import '../../data/services/payroll_service.dart';
import '../employee/apply_leave_dialog.dart';
import '../finance/salary_slips_screen.dart';
import '../finance/payslip_preview_dialog.dart';
import '../sales/lead_detail_screen.dart';
import '../profile/profile_screen.dart';
import '../widgets/dashboard_charts.dart';
import '../widgets/error_banner.dart';
import '../widgets/logout_dialog.dart';
import '../widgets/quick_actions_sheet.dart';
import '../widgets/stat_card.dart';
import '../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const DashboardScreen({super.key, this.onNavigateTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _activeTab = 'summary';

  List<Map<String, String>> _getFilteredTabs(bool isSales) {
    return [
      {'id': 'summary', 'label': 'Summary'},
      {'id': 'attendance', 'label': 'Attendance'},
      {'id': 'tasks', 'label': 'Tasks'},
      {'id': 'leaves', 'label': 'Leaves'},
      {'id': 'payroll', 'label': 'Payroll & Salary'},
      if (isSales) {'id': 'sales', 'label': 'Sales'},
    ];
  }

  WorkDetailsModel? _workDetails;
  SalarySlipModel? _latestSlip;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refresh();
    });
  }

  Future<void> _loadPayrollData() async {
    final user = context.read<AuthProvider>().user;
    try {
      final service = PayrollService();
      final work = await service.getWorkDetails(user: user);
      final slips = await service.getSalarySlips(user: user);
      if (mounted) {
        setState(() {
          _workDetails = work;
          _latestSlip = slips.isNotEmpty ? slips.first : service.createLatestSlip(work);
        });
      }
    } catch (_) {
      if (mounted) {
        final fallbackWork = WorkDetailsModel.fromUser(user);
        setState(() {
          _workDetails = fallbackWork;
          _latestSlip = PayrollService().createLatestSlip(fallbackWork);
        });
      }
    }
  }

  Future<void> _refresh() async {
    final user = context.read<AuthProvider>().user;
    await Future.wait([
      context.read<AttendanceProvider>().fetchTodayStatus(),
      context.read<AttendanceProvider>().fetchHistory(),
      context.read<TaskProvider>().fetchTasks(),
      context.read<LeaveProvider>().fetchBalance(user?.id),
      context.read<LeaveProvider>().fetchLeaves(),
      context.read<DashboardProvider>().fetchDashboardData(),
      _loadPayrollData(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final attendance = context.watch<AttendanceProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final leaveProvider = context.watch<LeaveProvider>();
    final dashboard = context.watch<DashboardProvider>();

    final user = auth.user;
    final isSales = user?.isSalesDepartment ?? false;
    final tabs = _getFilteredTabs(isSales);
    if (!isSales && _activeTab == 'sales') {
      _activeTab = 'summary';
    }

    final today = attendance.todayStatus;
    final pendingTasks = taskProvider.pendingTasks.length;
    final totalTasks = taskProvider.tasks.length;
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Error Diagnostic Banner
                if (dashboard.errorMessage != null) ...[
                  ErrorBanner(
                    endpoint: dashboard.errorEndpoint,
                    message: dashboard.errorMessage!,
                    onRetry: _refresh,
                    onDismiss: dashboard.dismissError,
                  ),
                  const SizedBox(height: 12),
                ],

                // Compact Employee Header (Matches web EmployeeDashboard.jsx ep-header)
                _buildEmployeeHeader(context, user, today, pendingTasks),
                const SizedBox(height: 14),

                // Tab Navigation Pills (Summary, Attendance, Tasks, Leaves, Payroll, Sales)
                _buildTabsBar(tabs),
                const SizedBox(height: 14),

                // Dynamic KPI Badges depending on selected tab
                _buildDynamicKPIs(
                  context,
                  today: today,
                  pendingTasks: pendingTasks,
                  totalTasks: totalTasks,
                  leaveProvider: leaveProvider,
                  dashboardStats: dashboard.stats,
                  isTablet: isTablet,
                ),
                const SizedBox(height: 16),

                // Tab Content Area
                if (_activeTab == 'summary')
                  _buildSummaryTab(context, attendance, taskProvider, isTablet)
                else if (_activeTab == 'attendance')
                  _buildAttendanceTab(context, attendance, isTablet)
                else if (_activeTab == 'tasks')
                  _buildTasksTab(context, taskProvider)
                else if (_activeTab == 'leaves')
                  _buildLeavesTab(context, leaveProvider)
                else if (_activeTab == 'payroll')
                  _buildPayrollTab(context)
                else if (_activeTab == 'sales' && isSales)
                  _buildSalesTab(context, dashboard),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Header Section (Matching ep-header) ---
  Widget _buildEmployeeHeader(
    BuildContext context,
    dynamic user,
    TodayAttendanceStatus today,
    int pendingTasks,
  ) {
    final userName = user?.name ?? 'Employee';
    final userDept = user?.department ?? 'IT';
    final isCheckedIn = today.isCheckedIn;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar circle with gradient & online dot (taps to Profile)
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProfileScreen()),
                  );
                },
                child: Stack(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'E',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: isCheckedIn ? AppColors.success : const Color(0xFF94A3B8),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Title and Designation (taps to Profile)
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    );
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              userName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.success.withValues(alpha: 0.25)),
                            ),
                            child: const Text(
                              'Portal',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Dept: $userDept',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),

              // Actions: Sync Data, Quick Actions, and Logout
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                tooltip: 'Sync Data',
                icon: const Icon(Icons.sync_rounded, color: AppColors.primary, size: 21),
                onPressed: _refresh,
              ),
              InkWell(
                onTap: () => QuickActionsSheet.show(context, onNavigateTab: widget.onNavigateTab),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.bolt_rounded, color: AppColors.primary, size: 20),
                ),
              ),
              const SizedBox(width: 4),
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                tooltip: 'Log Out / Switch ID',
                icon: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 21),
                onPressed: () => LogoutDialog.show(context),
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.borderLight),
          const SizedBox(height: 10),

          // Meta Row: Logged Hours, Pending Tasks, Secure Connection
          Row(
            children: [
              _buildMetaChip(
                icon: Icons.access_time_rounded,
                label: isCheckedIn
                    ? 'Logged: ${today.activeHoursWorked.toStringAsFixed(1)}h'
                    : 'Check-in Pending',
                color: isCheckedIn ? AppColors.success : const Color(0xFFF59E0B),
              ),
              const SizedBox(width: 8),
              _buildMetaChip(
                icon: Icons.check_circle_outline_rounded,
                label: 'Tasks: $pendingTasks',
                color: const Color(0xFF3B82F6),
              ),
              const SizedBox(width: 8),
              _buildMetaChip(
                icon: Icons.shield_outlined,
                label: 'Secure',
                color: const Color(0xFF8B5CF6),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetaChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Tab Navigation Pills ---
  Widget _buildTabsBar(List<Map<String, String>> tabs) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tabs.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final tab = tabs[index];
          final isSelected = _activeTab == tab['id'];

          return InkWell(
            onTap: () {
              setState(() {
                _activeTab = tab['id']!;
              });
            },
            borderRadius: BorderRadius.circular(20),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.borderLight,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Text(
                tab['label']!,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // --- Dynamic KPI Cards (Responsive & Overflow-Free) ---
  Widget _buildDynamicKPIs(
    BuildContext context, {
    required TodayAttendanceStatus today,
    required int pendingTasks,
    required int totalTasks,
    required LeaveProvider leaveProvider,
    required DashboardStatsModel dashboardStats,
    required bool isTablet,
  }) {
    final completedTasks = totalTasks - pendingTasks;
    final completionRate = totalTasks > 0
        ? '${((completedTasks / totalTasks) * 100).toInt()}%'
        : '100%';

    final annualLeave = leaveProvider.balance.annual.toInt();
    final casualLeave = leaveProvider.balance.casual.toInt();
    final sickLeave = leaveProvider.balance.sick.toInt();
    final totalRemaining = leaveProvider.balance.totalRemaining.toInt();

    List<Widget> cards = [];

    if (_activeTab == 'summary') {
      cards = [
        StatCard(
          title: "Today's Hours",
          value: '${today.activeHoursWorked.toStringAsFixed(1)}h',
          icon: Icons.access_time_rounded,
          iconColor: const Color(0xFFF59E0B),
          subtitle: today.isCheckedIn ? 'Active' : 'Pending',
        ),
        StatCard(
          title: 'Monthly Hours',
          value: '${today.monthlyHours ?? 160}h',
          icon: Icons.trending_up_rounded,
          iconColor: const Color(0xFF3B82F6),
          subtitle: 'Target: 160h',
        ),
        StatCard(
          title: 'Pending Tasks',
          value: pendingTasks.toString(),
          icon: Icons.check_circle_outline_rounded,
          iconColor: const Color(0xFF10B981),
          subtitle: '$totalTasks Total',
          onTap: () => setState(() => _activeTab = 'tasks'),
        ),
        StatCard(
          title: 'Leave Balance',
          value: totalRemaining.toString(),
          icon: Icons.calendar_month_rounded,
          iconColor: const Color(0xFF8B5CF6),
          subtitle: 'Days Left',
          onTap: () => setState(() => _activeTab = 'leaves'),
        ),
      ];
    } else if (_activeTab == 'attendance') {
      cards = [
        StatCard(
          title: 'Total Hours',
          value: '${today.monthlyHours ?? 160}h',
          icon: Icons.access_time_rounded,
          iconColor: const Color(0xFF3B82F6),
          subtitle: 'This Month',
        ),
        const StatCard(
          title: 'Active Days',
          value: '22',
          icon: Icons.calendar_today_rounded,
          iconColor: Color(0xFF10B981),
          subtitle: 'Working Days',
        ),
        const StatCard(
          title: 'Avg Hours/Day',
          value: '8.2h',
          icon: Icons.speed_rounded,
          iconColor: Color(0xFF6366F1),
          subtitle: 'Productivity',
        ),
        StatCard(
          title: 'Today Status',
          value: today.isCheckedIn ? 'PRESENT' : today.status.toUpperCase(),
          icon: Icons.fingerprint_rounded,
          iconColor: today.isCheckedIn ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
          subtitle: today.isCheckedIn ? 'Present' : 'Not Checked In',
        ),
      ];
    } else if (_activeTab == 'tasks') {
      cards = [
        StatCard(
          title: 'Pending Tasks',
          value: pendingTasks.toString(),
          icon: Icons.pending_actions_rounded,
          iconColor: const Color(0xFFF59E0B),
          subtitle: 'Action Required',
        ),
        StatCard(
          title: 'Completed',
          value: completedTasks.toString(),
          icon: Icons.task_alt_rounded,
          iconColor: const Color(0xFF10B981),
          subtitle: 'Done',
        ),
        StatCard(
          title: 'Total Assigned',
          value: totalTasks.toString(),
          icon: Icons.assignment_outlined,
          iconColor: const Color(0xFF3B82F6),
          subtitle: 'All Time',
        ),
        StatCard(
          title: 'Completion Rate',
          value: completionRate,
          icon: Icons.military_tech_rounded,
          iconColor: const Color(0xFF8B5CF6),
          subtitle: 'Quality',
        ),
      ];
    } else if (_activeTab == 'leaves') {
      cards = [
        StatCard(
          title: 'Annual Leave',
          value: annualLeave.toString(),
          icon: Icons.beach_access_rounded,
          iconColor: const Color(0xFF3B82F6),
          subtitle: 'Days',
        ),
        StatCard(
          title: 'Casual Leave',
          value: casualLeave.toString(),
          icon: Icons.event_note_rounded,
          iconColor: const Color(0xFF10B981),
          subtitle: 'Days',
        ),
        StatCard(
          title: 'Sick Leave',
          value: sickLeave.toString(),
          icon: Icons.medical_services_outlined,
          iconColor: const Color(0xFFF59E0B),
          subtitle: 'Days',
        ),
        StatCard(
          title: 'Total Remaining',
          value: totalRemaining.toString(),
          icon: Icons.work_outline_rounded,
          iconColor: const Color(0xFF8B5CF6),
          subtitle: 'Available',
        ),
      ];
    } else if (_activeTab == 'payroll') {
      cards = const [
        StatCard(
          title: 'Last Net Pay',
          value: '₹45,000',
          icon: Icons.payments_rounded,
          iconColor: Color(0xFF10B981),
          subtitle: 'Credited',
        ),
        StatCard(
          title: 'Last Paid',
          value: 'Sep 2026',
          icon: Icons.calendar_month_rounded,
          iconColor: Color(0xFF3B82F6),
          subtitle: 'Monthly',
        ),
        StatCard(
          title: 'Tax Deducted',
          value: '₹5,000',
          icon: Icons.receipt_long_rounded,
          iconColor: Color(0xFFF59E0B),
          subtitle: 'TDS/PF',
        ),
        StatCard(
          title: 'Next Payout',
          value: 'Upcoming',
          icon: Icons.update_rounded,
          iconColor: Color(0xFF8B5CF6),
          subtitle: '31 Oct',
        ),
      ];
    } else if (_activeTab == 'sales') {
      cards = [
        StatCard(
          title: 'Pipeline',
          value: '${dashboardStats.totalLeads} Leads',
          icon: Icons.trending_up_rounded,
          iconColor: const Color(0xFF3B82F6),
          subtitle: 'View Leads',
          onTap: () => widget.onNavigateTab?.call(1),
        ),
        StatCard(
          title: 'Active Deals',
          value: '${dashboardStats.activeDeals}',
          icon: Icons.handshake_rounded,
          iconColor: const Color(0xFF10B981),
          subtitle: 'In Progress',
        ),
        StatCard(
          title: 'Clients',
          value: '${dashboardStats.activeClients}',
          icon: Icons.business_center_rounded,
          iconColor: const Color(0xFF8B5CF6),
          subtitle: 'Portfolio',
        ),
        const StatCard(
          title: 'Monthly Target',
          value: 'Active',
          icon: Icons.track_changes_rounded,
          iconColor: Color(0xFFF59E0B),
          subtitle: 'Q3 Targets',
        ),
      ];
    }

    return GridView.count(
      crossAxisCount: isTablet ? 4 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: isTablet ? 1.5 : 1.25,
      children: cards,
    );
  }

  // --- Summary Tab Content ---
  Widget _buildSummaryTab(
    BuildContext context,
    AttendanceProvider attendance,
    TaskProvider taskProvider,
    bool isTablet,
  ) {
    final today = attendance.todayStatus;
    final isCheckedIn = today.isCheckedIn;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Live Quick Punch Attendance Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: isCheckedIn
                ? const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: (isCheckedIn ? Colors.black : const Color(0xFF4F46E5)).withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isCheckedIn ? Icons.verified_rounded : Icons.fingerprint_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Today\'s Attendance',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                isCheckedIn
                                    ? 'Status: Present'
                                    : 'Status: Check-in Pending',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCheckedIn
                          ? AppColors.success.withValues(alpha: 0.25)
                          : const Color(0xFFF59E0B).withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isCheckedIn ? 'ON DUTY' : 'OFF DUTY',
                      style: TextStyle(
                        color: isCheckedIn ? const Color(0xFF4ADE80) : const Color(0xFFFDE047),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Check-In Time',
                          style: TextStyle(color: Colors.white60, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          today.checkIn != null
                              ? Formatters.formatTime(today.checkIn!)
                              : '--:--',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Hours Worked',
                          style: TextStyle(color: Colors.white60, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${today.activeHoursWorked.toStringAsFixed(1)} hrs',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCheckedIn ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    icon: Icon(
                      isCheckedIn ? Icons.logout_rounded : Icons.login_rounded,
                      size: 18,
                    ),
                    label: Text(
                      isCheckedIn ? 'Punch Out' : 'Punch In',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    onPressed: () async {
                      if (isCheckedIn) {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Confirm Punch Out'),
                            content: const Text('Are you sure you want to end your shift today?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Punch Out', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          final success = await attendance.punchOut();
                          if (success && context.mounted) {
                            ToastUtil.showSuccess(context, 'Punched out successfully!');
                          }
                        }
                      } else {
                        final success = await attendance.punchIn();
                        if (success && context.mounted) {
                          ToastUtil.showSuccess(context, 'Punched in successfully!');
                        }
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Performance Snapshot Card (From web Performance Snapshot)
        _buildSectionCard(
          title: 'Performance Snapshot',
          subtitle: 'Current review cycle & rating',
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Overall Rating',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '4.8',
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    Row(
                      children: List.generate(
                        5,
                        (i) => const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSnapshotRow('Current Cycle', '2026 Q3 Final'),
                    const SizedBox(height: 8),
                    _buildSnapshotRow('Review Status', 'Active & Verified', isNeon: true),
                    const SizedBox(height: 8),
                    _buildSnapshotRow('Appraisals', 'Scheduled (Next Month)'),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Weekly Attendance Hours Trend Chart
        _buildSectionCard(
          title: 'Weekly Attendance Trend',
          subtitle: 'Hours logged per day this week',
          child: const WeeklyAttendanceBarChart(),
        ),
        const SizedBox(height: 16),

        // Priority Tasks List (Real live tasks from /api/employees/tasks)
        _buildSectionCard(
          title: 'My Priority Tasks',
          subtitle: 'Assigned tasks requiring attention',
          trailing: TextButton(
            onPressed: () => setState(() => _activeTab = 'tasks'),
            child: const Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          child: taskProvider.tasks.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(
                    child: Text(
                      'No pending tasks assigned.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: taskProvider.tasks.take(3).length,
                  separatorBuilder: (_, _) => const Divider(height: 14, color: AppColors.borderLight),
                  itemBuilder: (context, index) {
                    final task = taskProvider.tasks[index];
                    return _buildTaskTile(task, taskProvider);
                  },
                ),
        ),
      ],
    );
  }

  // --- Attendance Tab Content ---
  Widget _buildAttendanceTab(BuildContext context, AttendanceProvider attendance, bool isTablet) {
    final today = attendance.todayStatus;
    final isCheckedIn = today.isCheckedIn;
    final history = attendance.history;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Today's Detailed Punch Card
        _buildSectionCard(
          title: 'Today\'s Attendance Details',
          subtitle: 'Recorded via Radhix Mobile App',
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildPunchTimeBox('Check In', today.checkIn != null ? Formatters.formatTime(today.checkIn!) : '--:--', Icons.login_rounded, AppColors.success),
                  _buildPunchTimeBox('Check Out', today.checkOut != null ? Formatters.formatTime(today.checkOut!) : '--:--', Icons.logout_rounded, AppColors.danger),
                  _buildPunchTimeBox('Hours', '${today.activeHoursWorked.toStringAsFixed(1)}h', Icons.timer_outlined, AppColors.primary),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isCheckedIn ? AppColors.danger : AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: Icon(isCheckedIn ? Icons.logout_rounded : Icons.login_rounded),
                  label: Text(
                    isCheckedIn ? 'Punch Out Now' : 'Punch In Now',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  onPressed: () async {
                    if (isCheckedIn) {
                      final success = await attendance.punchOut();
                      if (success && context.mounted) {
                        ToastUtil.showSuccess(context, 'Checked out successfully');
                      }
                    } else {
                      final success = await attendance.punchIn();
                      if (success && context.mounted) {
                        ToastUtil.showSuccess(context, 'Checked in successfully');
                      }
                    }
                  },
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Monthly Attendance Breakdown List
        _buildSectionCard(
          title: 'Monthly Attendance Breakdown',
          subtitle: 'Recent check-ins and hours history',
          child: history.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(
                    child: Text('No attendance history records found.'),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: history.take(10).length,
                  separatorBuilder: (_, _) => const Divider(height: 12, color: AppColors.borderLight),
                  itemBuilder: (context, index) {
                    final item = history[index];
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              Formatters.formatDate(item.date),
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                            ),
                            Text(
                              'In: ${item.checkIn != null ? Formatters.formatTime(item.checkIn!) : '--'} | Out: ${item.checkOut != null ? Formatters.formatTime(item.checkOut!) : '--'}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Text(
                              '${item.hoursWorked}h',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                            ),
                            const SizedBox(width: 8),
                            StatusBadge(status: item.status),
                          ],
                        ),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- Tasks Tab Content ---
  Widget _buildTasksTab(BuildContext context, TaskProvider taskProvider) {
    final tasks = taskProvider.tasks;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionCard(
          title: 'My Assigned Tasks',
          subtitle: 'Active tasks and deliverables',
          trailing: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.add, size: 16),
            label: const Text('New Task', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            onPressed: () {
              widget.onNavigateTab?.call(3); // Open Tasks Screen
            },
          ),
          child: tasks.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Text('No tasks assigned. You are all caught up!'),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: tasks.length,
                  separatorBuilder: (_, _) => const Divider(height: 14, color: AppColors.borderLight),
                  itemBuilder: (context, index) {
                    final task = tasks[index];
                    return _buildTaskTile(task, taskProvider);
                  },
                ),
        ),
      ],
    );
  }

  // --- Leaves Tab Content ---
  Widget _buildLeavesTab(BuildContext context, LeaveProvider leaveProvider) {
    final leaves = leaveProvider.leaves;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Apply Leave Banner Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Need time off?',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                  ),
                  Text(
                    'Submit a leave request for approval',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Apply Leave', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => const ApplyLeaveDialog(),
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Leave Applications History
        _buildSectionCard(
          title: 'Leave History',
          subtitle: 'Your recent leave applications and status',
          child: leaves.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(
                    child: Text('No leave applications submitted yet.'),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: leaves.take(8).length,
                  separatorBuilder: (_, _) => const Divider(height: 12, color: AppColors.borderLight),
                  itemBuilder: (context, index) {
                    final item = leaves[index];
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${Formatters.formatDate(item.startDate)} - ${Formatters.formatDate(item.endDate)}',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                            ),
                            Text(
                              '${item.type.toUpperCase()} • ${item.days} Day(s) ${item.halfDay ? '(Half Day)' : ''}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        StatusBadge(status: item.status),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- Payroll Tab Content ---
  Widget _buildPayrollTab(BuildContext context) {
    final user = context.read<AuthProvider>().user;
    final work = _workDetails ?? WorkDetailsModel.fromUser(user);
    final slip = _latestSlip ?? PayrollService().createLatestSlip(work);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Work Details Summary Card (Matches user work profile)
        _buildSectionCard(
          title: 'Work & Employment Details',
          subtitle: 'Official Radhix Technologies employment record',
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surfaceSubtle,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              children: [
                _buildSalaryRow('Employee Name', work.employeeName),
                _buildSalaryRow('Employee ID', work.employeeId),
                _buildSalaryRow('Department', work.department),
                _buildSalaryRow('Designation', work.designation),
                _buildSalaryRow('Employment Type', work.employmentType),
                _buildSalaryRow('Annual CTC / Salary', Formatters.formatCurrency(work.salary)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        _buildSectionCard(
          title: 'Latest Salary Statement',
          subtitle: 'Monthly compensation breakdown and deductions',
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Month: ${slip.monthName} ${slip.year}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        StatusBadge(status: slip.status),
                      ],
                    ),
                    const Divider(height: 20, color: AppColors.borderLight),
                    _buildSalaryRow('Basic Salary', Formatters.formatCurrency(slip.basicSalary)),
                    _buildSalaryRow('House Rent Allowance (HRA)', Formatters.formatCurrency(slip.hra)),
                    _buildSalaryRow('Special Allowances', Formatters.formatCurrency(slip.allowances)),
                    _buildSalaryRow('Gross Monthly Salary', Formatters.formatCurrency(slip.grossSalary)),
                    _buildSalaryRow('Deductions (Provident Fund)', '- ${Formatters.formatCurrency(slip.pf)}', isDeduction: true),
                    if (slip.esi > 0)
                      _buildSalaryRow('Deductions (ESI)', '- ${Formatters.formatCurrency(slip.esi)}', isDeduction: true),
                    if (slip.tds > 0)
                      _buildSalaryRow('Deductions (TDS / Tax)', '- ${Formatters.formatCurrency(slip.tds)}', isDeduction: true),
                    const Divider(height: 20, color: AppColors.borderLight),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Net Disbursed Take-Home', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(Formatters.formatCurrency(slip.netSalary), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.success)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.receipt_long_rounded, size: 16),
                            label: const Text('View All Slips'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const SalarySlipsScreen()),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.download_rounded, size: 16),
                            label: const Text('Download Payslip'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              side: const BorderSide(color: AppColors.primary),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: () async {
                              ToastUtil.showInfo(context, 'Preparing your latest salary slip...');
                              try {
                                final service = PayrollService();
                                final path = await service.saveSalarySlipToFile(slip, work);
                                if (context.mounted) {
                                  ToastUtil.showSuccess(context, 'Payslip saved to Downloads folder:\n$path');
                                  PayslipPreviewDialog.show(
                                    context,
                                    slip: slip,
                                    work: work,
                                    savedPath: path,
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ToastUtil.showError(context, 'Failed to save payslip: $e');
                                }
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- Sales Tab Content ---
  Widget _buildSalesTab(BuildContext context, DashboardProvider dashboard) {
    final leads = dashboard.recentLeads;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionCard(
          title: 'My Sales Workspace',
          subtitle: 'Assigned customer leads and follow-ups',
          trailing: TextButton(
            onPressed: () => widget.onNavigateTab?.call(1),
            child: const Text('All Leads', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          child: leads.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: Text('No leads assigned yet.')),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: leads.take(5).length,
                  separatorBuilder: (_, _) => const Divider(height: 12, color: AppColors.borderLight),
                  itemBuilder: (context, index) {
                    final lead = leads[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        child: Text(
                          lead.name.isNotEmpty ? lead.name[0].toUpperCase() : 'L',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(lead.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text(lead.company, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      trailing: StatusBadge(status: lead.status),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LeadDetailScreen(lead: lead),
                          ),
                        );
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- Helper Widgets ---
  Widget _buildSectionCard({
    required String title,
    required String subtitle,
    required Widget child,
    Widget? trailing,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildSnapshotRow(String label, String value, {bool isNeon = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        if (isNeon)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              value,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.success),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          )
        else
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
            ),
          ),
      ],
    );
  }

  Widget _buildTaskTile(TaskModel task, TaskProvider provider) {
    return Row(
      children: [
        IconButton(
          icon: Icon(
            task.isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
            color: task.isCompleted ? AppColors.success : AppColors.textSecondary,
            size: 20,
          ),
          onPressed: () async {
            await provider.updateStatus(task.id, task.isCompleted ? 'in_progress' : 'completed');
          },
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                task.title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                  color: task.isCompleted ? AppColors.textSecondary : AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (task.description.isNotEmpty)
                Text(
                  task.description,
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        StatusBadge(status: task.status),
      ],
    );
  }

  Widget _buildPunchTimeBox(String label, String time, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(height: 4),
        Text(time, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildSalaryRow(String label, String value, {bool isDeduction = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDeduction ? AppColors.danger : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
