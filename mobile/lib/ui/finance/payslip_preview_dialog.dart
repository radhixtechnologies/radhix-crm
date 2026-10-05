import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/salary_slip_model.dart';

class PayslipPreviewDialog extends StatelessWidget {
  final SalarySlipModel slip;
  final WorkDetailsModel work;
  final String savedPath;

  const PayslipPreviewDialog({
    super.key,
    required this.slip,
    required this.work,
    required this.savedPath,
  });

  static void show(
    BuildContext context, {
    required SalarySlipModel slip,
    required WorkDetailsModel work,
    required String savedPath,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PayslipPreviewDialog(
        slip: slip,
        work: work,
        savedPath: savedPath,
      ),
    );
  }

  void _openInBrowser(BuildContext context) async {
    final html = '''
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Salary Slip - ${slip.monthName} ${slip.year} - ${work.employeeName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 16px; color: #1e293b; background: #f8fafc; }
  .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); max-width: 650px; margin: 0 auto; }
  .header { border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
  .company { font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
  .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
  .badge { background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  .table th, .table td { border: 1px solid #e2e8f0; padding: 9px 12px; font-size: 13px; text-align: left; }
  .table th { background: #f1f5f9; font-weight: 600; color: #334155; }
  .net { background: #f0fdf4; font-size: 16px; font-weight: bold; color: #166534; }
  .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="company">RADHIX TECHNOLOGIES</div>
        <div class="sub">Confidential Employee Salary Statement</div>
      </div>
      <div class="badge">${slip.monthName.toUpperCase()} ${slip.year}</div>
    </div>
    <table class="table">
      <tr><th>Employee Name</th><td><strong>${work.employeeName}</strong></td><th>Employee ID</th><td><strong>${work.employeeId}</strong></td></tr>
      <tr><th>Department</th><td>${work.department}</td><th>Designation</th><td>${work.designation}</td></tr>
      <tr><th>Employment Type</th><td>${work.employmentType}</td><th>Annual CTC</th><td>₹${work.salary.toStringAsFixed(2)}</td></tr>
      <tr><th>Statement Period</th><td>${slip.monthName} ${slip.year}</td><th>Status</th><td><strong style="color:#059669;">${slip.status.toUpperCase()}</strong></td></tr>
    </table>
    <h4 style="margin-top:20px; margin-bottom:6px; color:#0f172a;">Earnings & Deductions</h4>
    <table class="table">
      <tr><th>Earnings Component</th><th>Amount</th><th>Deduction Component</th><th>Amount</th></tr>
      <tr><td>Basic Pay (50%)</td><td>₹${slip.basicSalary.toStringAsFixed(2)}</td><td>Provident Fund (PF)</td><td>₹${slip.pf.toStringAsFixed(2)}</td></tr>
      <tr><td>House Rent Allowance (HRA)</td><td>₹${slip.hra.toStringAsFixed(2)}</td><td>Employee State Insurance (ESI)</td><td>₹${slip.esi.toStringAsFixed(2)}</td></tr>
      <tr><td>Special Allowances</td><td>₹${slip.allowances.toStringAsFixed(2)}</td><td>Professional Tax / TDS</td><td>₹${slip.tds.toStringAsFixed(2)}</td></tr>
      <tr><th>Total Gross Pay</th><th>₹${slip.grossSalary.toStringAsFixed(2)}</th><th>Total Deductions</th><th>₹${slip.deductions.toStringAsFixed(2)}</th></tr>
      <tr class="net"><td colspan="2">Net Disbursed Take-Home Pay</td><td colspan="2">₹${slip.netSalary.toStringAsFixed(2)}</td></tr>
    </table>
    <div class="footer">
      Computer-generated document • Radhix Technologies • https://radhix.com
    </div>
  </div>
</body>
</html>
''';

    try {
      final uri = Uri.dataFromString(html, mimeType: 'text/html', encoding: utf8);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (context.mounted) {
        ToastUtil.showInfo(context, 'Saved in Downloads folder: $savedPath');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(4),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
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
                      child: const Icon(Icons.receipt_long_rounded, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${slip.monthName} ${slip.year} Payslip',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          work.employeeName,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.borderLight),

          // Content Scrollable
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Success Save Notification Badge
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Saved to Phone Storage',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: Color(0xFF166534),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                savedPath,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF15803D),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Copy file path',
                          icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF166534)),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: savedPath));
                            ToastUtil.showSuccess(context, 'File path copied to clipboard!');
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Employee Details Box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSubtle,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      children: [
                        _buildRow('Employee Name', work.employeeName, isBold: true),
                        _buildRow('Employee ID', work.employeeId),
                        _buildRow('Department', work.department),
                        _buildRow('Designation', work.designation),
                        _buildRow('Employment Type', work.employmentType),
                        _buildRow('Annual CTC', Formatters.formatCurrency(work.salary)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Net Take-Home Highlight Box
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF047857), Color(0xFF059669)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF059669).withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'NET DISBURSED PAY',
                              style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Take-Home Salary',
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        Text(
                          Formatters.formatCurrency(slip.netSalary),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Earnings Breakdown
                  const Text(
                    'Salary Breakdown',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      children: [
                        _buildRow('Basic Salary', Formatters.formatCurrency(slip.basicSalary)),
                        _buildRow('House Rent Allowance (HRA)', Formatters.formatCurrency(slip.hra)),
                        _buildRow('Special Allowances', Formatters.formatCurrency(slip.allowances)),
                        const Divider(height: 16, color: AppColors.borderLight),
                        _buildRow('Total Gross Pay', Formatters.formatCurrency(slip.grossSalary), isBold: true),
                        _buildRow('Provident Fund (PF)', '- ${Formatters.formatCurrency(slip.pf)}', isDanger: true),
                        if (slip.esi > 0)
                          _buildRow('ESI', '- ${Formatters.formatCurrency(slip.esi)}', isDanger: true),
                        if (slip.tds > 0)
                          _buildRow('TDS / Tax', '- ${Formatters.formatCurrency(slip.tds)}', isDanger: true),
                        const Divider(height: 16, color: AppColors.borderLight),
                        _buildRow('Net Disbursed Pay', Formatters.formatCurrency(slip.netSalary), isSuccess: true, isBold: true),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.borderLight)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.open_in_browser_rounded, size: 18),
                    label: const Text('View in Browser'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _openInBrowser(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                    label: const Text('Done'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(
    String label,
    String value, {
    bool isBold = false,
    bool isDanger = false,
    bool isSuccess = false,
  }) {
    Color textColor = AppColors.textPrimary;
    if (isDanger) textColor = const Color(0xFFDC2626);
    if (isSuccess) textColor = const Color(0xFF059669);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
