import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../core/network/api_client.dart';
import '../models/salary_slip_model.dart';
import '../models/user_model.dart';

class PayrollService {
  final ApiClient _client = ApiClient();

  Future<WorkDetailsModel> getWorkDetails({UserModel? user}) async {
    try {
      final res = await _client.get('/employees/me');
      if (res is Map && res['data'] is Map) {
        return WorkDetailsModel.fromJson(
          Map<String, dynamic>.from(res['data']),
          user: user,
        );
      }
    } catch (_) {}

    // Fallback dynamically from the logged-in user profile
    return WorkDetailsModel.fromUser(user);
  }

  Future<List<SalarySlipModel>> getSalarySlips({UserModel? user}) async {
    final work = await getWorkDetails(user: user);

    try {
      final res = await _client.get('/payroll/salary-slips');
      if (res is Map && res['data'] is List) {
        final list = (res['data'] as List)
            .whereType<Map<String, dynamic>>()
            .map((e) => SalarySlipModel.fromJson(e, fallbackWork: work))
            .toList();
        if (list.isNotEmpty) return list;
      }
    } catch (_) {}

    // Dynamic generation from work details for this specific employee
    final monthlyGross = work.monthlyGross;
    final basic = work.basicSalary;
    final deductions = work.totalDeductions;
    final net = work.netSalary;

    final now = DateTime.now();
    final currentYear = now.year;
    final currentMonth = now.month;

    final slips = <SalarySlipModel>[];
    for (int i = 0; i < 3; i++) {
      int m = currentMonth - i;
      int y = currentYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }

      slips.add(
        SalarySlipModel(
          id: 'slip_${work.employeeId.replaceAll('#', '').replaceAll('/', '_')}_${y}_$m',
          month: m,
          year: y,
          basicSalary: basic,
          grossSalary: monthlyGross,
          deductions: deductions,
          netSalary: net,
          hra: work.hra,
          allowances: work.allowances,
          pf: work.pf,
          esi: work.esi,
          tds: work.tds,
          status: i == 0 ? 'Processed' : 'Paid',
          paidAt: DateTime(y, m, 28),
          employeeId: work.employeeId,
          employeeName: work.employeeName,
          department: work.department,
          designation: work.designation,
          employmentType: work.employmentType,
          annualSalary: work.salary,
        ),
      );
    }

    return slips;
  }

  SalarySlipModel createLatestSlip(WorkDetailsModel work) {
    final now = DateTime.now();
    return SalarySlipModel(
      id: 'slip_${work.employeeId.replaceAll('#', '').replaceAll('/', '_')}_${now.year}_${now.month}',
      month: now.month,
      year: now.year,
      basicSalary: work.basicSalary,
      grossSalary: work.monthlyGross,
      deductions: work.totalDeductions,
      netSalary: work.netSalary,
      hra: work.hra,
      allowances: work.allowances,
      pf: work.pf,
      esi: work.esi,
      tds: work.tds,
      status: 'Paid',
      paidAt: DateTime(now.year, now.month, 28),
      employeeId: work.employeeId,
      employeeName: work.employeeName,
      department: work.department,
      designation: work.designation,
      employmentType: work.employmentType,
      annualSalary: work.salary,
    );
  }

  Future<String> saveSalarySlipToFile(SalarySlipModel slip, WorkDetailsModel work) async {
    Directory? targetDir;

    if (Platform.isAndroid) {
      try {
        final publicDownload = Directory('/storage/emulated/0/Download');
        if (await publicDownload.exists()) {
          final candidate = Directory('${publicDownload.path}/Radhix_Payslips');
          if (!await candidate.exists()) {
            await candidate.create(recursive: true);
          }
          targetDir = candidate;
        }
      } catch (_) {
        // Fallback to app documents directory if scoped storage prohibits writing directly
        targetDir = null;
      }
    }

    if (targetDir == null) {
      final dir = await getApplicationDocumentsDirectory();
      targetDir = Directory('${dir.path}/Payslips');
      if (!await targetDir.exists()) {
        await targetDir.create(recursive: true);
      }
    }

    final sanitizedId = work.employeeId.replaceAll('#', '').replaceAll('/', '_');
    final filename = 'Payslip_${slip.monthName}_${slip.year}_$sanitizedId.html';
    final file = File('${targetDir.path}/$filename');

    final htmlContent = '''
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Salary Slip - ${slip.monthName} ${slip.year} - ${work.employeeName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #1e293b; background: #f8fafc; }
  .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); max-width: 680px; margin: 0 auto; }
  .header { border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
  .company { font-size: 22px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
  .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
  .badge { background: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  .table th, .table td { border: 1px solid #e2e8f0; padding: 9px 12px; font-size: 13px; text-align: left; }
  .table th { background: #f1f5f9; font-weight: 600; color: #334155; }
  .net { background: #f0fdf4; font-size: 15px; font-weight: bold; color: #166534; }
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
      <tr>
        <th>Employee Name</th><td><strong>${work.employeeName}</strong></td>
        <th>Employee ID</th><td><strong>${work.employeeId}</strong></td>
      </tr>
      <tr>
        <th>Department</th><td>${work.department}</td>
        <th>Designation</th><td>${work.designation}</td>
      </tr>
      <tr>
        <th>Employment Type</th><td>${work.employmentType}</td>
        <th>Annual CTC</th><td>₹${work.salary.toStringAsFixed(2)}</td>
      </tr>
      <tr>
        <th>Statement Period</th><td>${slip.monthName} ${slip.year}</td>
        <th>Payment Status</th><td><strong style="color:#059669;">${slip.status.toUpperCase()}</strong></td>
      </tr>
    </table>
    <h4 style="margin-top:20px; margin-bottom:6px; color:#0f172a;">Earnings & Deductions Breakdown</h4>
    <table class="table">
      <tr><th>Earnings Component</th><th>Amount</th><th>Deduction Component</th><th>Amount</th></tr>
      <tr><td>Basic Pay (50%)</td><td>₹${slip.basicSalary.toStringAsFixed(2)}</td><td>Provident Fund (PF)</td><td>₹${slip.pf.toStringAsFixed(2)}</td></tr>
      <tr><td>House Rent Allowance (HRA)</td><td>₹${slip.hra.toStringAsFixed(2)}</td><td>Employee State Insurance (ESI)</td><td>₹${slip.esi.toStringAsFixed(2)}</td></tr>
      <tr><td>Special Allowances</td><td>₹${slip.allowances.toStringAsFixed(2)}</td><td>Professional Tax / TDS</td><td>₹${slip.tds.toStringAsFixed(2)}</td></tr>
      <tr><th>Total Gross Pay</th><th>₹${slip.grossSalary.toStringAsFixed(2)}</th><th>Total Deductions</th><th>₹${slip.deductions.toStringAsFixed(2)}</th></tr>
      <tr class="net"><td colspan="2">Net Disbursed Take-Home Pay</td><td colspan="2">₹${slip.netSalary.toStringAsFixed(2)}</td></tr>
    </table>
    <div class="footer">
      This is a computer-generated salary slip and does not require a physical signature.<br>
      Radhix Technologies • https://radhix.com
    </div>
  </div>
</body>
</html>
''';

    await file.writeAsString(htmlContent);
    return file.path;
  }
}
