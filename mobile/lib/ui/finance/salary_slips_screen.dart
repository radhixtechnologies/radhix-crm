import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'payslip_preview_dialog.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/salary_slip_model.dart';
import '../../data/services/payroll_service.dart';
import '../../providers/auth_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';

class SalarySlipsScreen extends StatefulWidget {
  const SalarySlipsScreen({super.key});

  @override
  State<SalarySlipsScreen> createState() => _SalarySlipsScreenState();
}

class _SalarySlipsScreenState extends State<SalarySlipsScreen> {
  final PayrollService _service = PayrollService();
  bool _isLoading = true;
  WorkDetailsModel? _workDetails;
  List<SalarySlipModel> _slips = [];
  String? _downloadingSlipId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final user = context.read<AuthProvider>().user;
      final work = await _service.getWorkDetails(user: user);
      final slips = await _service.getSalarySlips(user: user);
      if (mounted) {
        setState(() {
          _workDetails = work;
          _slips = slips;
        });
      }
    } catch (e) {
      if (mounted) {
        ToastUtil.showError(context, 'Failed to load salary slips: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _downloadSlip(SalarySlipModel slip) async {
    if (_workDetails == null) return;
    setState(() => _downloadingSlipId = slip.id);

    try {
      final path = await _service.saveSalarySlipToFile(slip, _workDetails!);
      if (mounted) {
        ToastUtil.showSuccess(
          context,
          'Salary slip downloaded & saved to phone:\n$path',
        );

        // Show full payslip preview dialog with safe HTML browser view & details
        PayslipPreviewDialog.show(
          context,
          slip: slip,
          work: _workDetails!,
          savedPath: path,
        );
      }
    } catch (e) {
      if (mounted) {
        ToastUtil.showError(context, 'Failed to save salary slip: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _downloadingSlipId = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Salary Slips & Payroll'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Work Details Card (Matches user screenshot exactly)
              if (_workDetails != null) _buildWorkDetailsCard(_workDetails!),
              const SizedBox(height: 20),

              // Salary Slips Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Monthly Payslips',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    '${_slips.length} Statements',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Slips List
              if (_isLoading && _slips.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_slips.isEmpty)
                const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No Salary Slips Found',
                  message: 'Your monthly salary slips will appear here once processed by HR.',
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _slips.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final slip = _slips[index];
                    return _buildSlipCard(slip);
                  },
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWorkDetailsCard(WorkDetailsModel work) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: const [
                Icon(Icons.business_center_outlined, color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Text(
                  'Work Details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.borderLight),

          // Details List
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                _buildWorkRow('Employee Name', work.employeeName, isBold: true),
                _buildWorkRow('Employee ID', work.employeeId),
                _buildWorkRow('Department', work.department),
                _buildWorkRow('Designation', work.designation),
                _buildWorkRow('Manager', work.manager),
                _buildWorkRow('Employment Type', work.employmentType),
                _buildWorkRow('Annual CTC', Formatters.formatCurrency(work.salary)),
                _buildWorkRow(
                  'Monthly In-Hand',
                  Formatters.formatCurrency(work.netSalary),
                  valueColor: const Color(0xFF059669),
                  isBold: true,
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWorkRow(
    String label,
    String value, {
    Color? valueColor,
    bool isBold = false,
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: valueColor ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlipCard(SalarySlipModel slip) {
    final isDownloading = _downloadingSlipId == slip.id;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Month & Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.receipt_rounded, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${slip.monthName} ${slip.year}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        slip.paidAt != null
                            ? 'Disbursed: ${Formatters.formatDate(slip.paidAt!)}'
                            : 'Status: ${slip.status}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ],
              ),
              StatusBadge(status: slip.status),
            ],
          ),
          const SizedBox(height: 14),

          // Net Salary Box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Net Take-Home Pay',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF166534)),
                ),
                Text(
                  Formatters.formatCurrency(slip.netSalary),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF166534),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Breakdown Row
          Row(
            children: [
              Expanded(
                child: _buildAmountBlock('Gross Pay', Formatters.formatCurrency(slip.grossSalary)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildAmountBlock(
                  'Deductions (PF)',
                  '- ${Formatters.formatCurrency(slip.deductions)}',
                  isDeduction: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Download Action Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: isDownloading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    )
                  : const Icon(Icons.download_rounded, size: 18),
              label: Text(isDownloading ? 'Saving to Phone...' : 'Download Payslip to Phone'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: isDownloading ? null : () => _downloadSlip(slip),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountBlock(String label, String amount, {bool isDeduction = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceSubtle,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 2),
          Text(
            amount,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isDeduction ? AppColors.danger : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
