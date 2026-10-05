import 'user_model.dart';

class SalarySlipModel {
  final String id;
  final int month;
  final int year;
  final double basicSalary;
  final double grossSalary;
  final double deductions;
  final double netSalary;
  final double hra;
  final double allowances;
  final double pf;
  final double esi;
  final double tds;
  final String status;
  final DateTime? paidAt;
  final String employeeId;
  final String employeeName;
  final String department;
  final String designation;
  final String employmentType;
  final double annualSalary;

  SalarySlipModel({
    required this.id,
    required this.month,
    required this.year,
    required this.basicSalary,
    required this.grossSalary,
    required this.deductions,
    required this.netSalary,
    this.hra = 0.0,
    this.allowances = 0.0,
    this.pf = 0.0,
    this.esi = 0.0,
    this.tds = 0.0,
    this.status = 'paid',
    this.paidAt,
    this.employeeId = '',
    this.employeeName = '',
    this.department = 'IT',
    this.designation = 'Developer',
    this.employmentType = 'Full-Time',
    this.annualSalary = 0.0,
  });

  String get monthName {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (month >= 1 && month <= 12) {
      return months[month - 1];
    }
    return 'Month $month';
  }

  factory SalarySlipModel.fromJson(Map<String, dynamic> json, {WorkDetailsModel? fallbackWork}) {
    final emp = json['employee'] is Map ? json['employee'] as Map<String, dynamic> : null;
    final user = emp?['user'] is Map ? emp!['user'] as Map<String, dynamic> : null;
    final struct = emp?['salaryStructure'] is Map ? emp!['salaryStructure'] as Map<String, dynamic> : null;

    final basic = (json['basicSalary'] is num)
        ? (json['basicSalary'] as num).toDouble()
        : (struct?['basic'] is num ? (struct!['basic'] as num).toDouble() : (fallbackWork?.basicSalary ?? 0.0));
    final gross = (json['grossSalary'] is num)
        ? (json['grossSalary'] as num).toDouble()
        : (fallbackWork?.monthlyGross ?? basic);
    final ded = (json['deductions'] is num)
        ? (json['deductions'] as num).toDouble()
        : (fallbackWork?.totalDeductions ?? 0.0);
    final net = (json['netSalary'] is num)
        ? (json['netSalary'] as num).toDouble()
        : (gross - ded);

    final hra = (struct?['hra'] is num)
        ? (struct!['hra'] as num).toDouble()
        : (fallbackWork?.hra ?? (gross * 0.3));
    final allowances = (struct?['allowances'] is num)
        ? (struct!['allowances'] as num).toDouble()
        : (fallbackWork?.allowances ?? (gross - basic - hra).clamp(0.0, double.infinity));
    final pf = (struct?['pf'] is num)
        ? (struct!['pf'] as num).toDouble()
        : (fallbackWork?.pf ?? (basic * 0.12));
    final esi = (struct?['esi'] is num) ? (struct!['esi'] as num).toDouble() : (fallbackWork?.esi ?? 0.0);
    final tds = (struct?['tds'] is num) ? (struct!['tds'] as num).toDouble() : (fallbackWork?.tds ?? 0.0);

    final annual = (emp?['salary'] is num)
        ? (emp!['salary'] as num).toDouble()
        : (fallbackWork?.salary ?? (gross * 12.0));

    final empId = (emp?['employeeId'] ?? fallbackWork?.employeeId ?? '').toString();
    final empName = (user?['name'] ?? fallbackWork?.employeeName ?? '').toString();
    final dept = (emp?['department'] ?? fallbackWork?.department ?? 'IT').toString();
    final desig = (emp?['designation'] ?? fallbackWork?.designation ?? 'Executive').toString();
    final empType = (emp?['employmentType'] ?? fallbackWork?.employmentType ?? 'Full-Time').toString();

    return SalarySlipModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      month: (json['month'] is num) ? (json['month'] as num).toInt() : DateTime.now().month,
      year: (json['year'] is num) ? (json['year'] as num).toInt() : DateTime.now().year,
      basicSalary: basic,
      grossSalary: gross,
      deductions: ded,
      netSalary: net,
      hra: hra,
      allowances: allowances,
      pf: pf,
      esi: esi,
      tds: tds,
      status: (json['status'] ?? 'paid').toString(),
      paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt'].toString()) : null,
      employeeId: empId,
      employeeName: empName,
      department: dept,
      designation: desig,
      employmentType: empType,
      annualSalary: annual,
    );
  }
}

class WorkDetailsModel {
  final String employeeId;
  final String employeeName;
  final String email;
  final String department;
  final String designation;
  final String manager;
  final String employmentType;
  final double salary; // Annual CTC or base package
  final double basicSalary;
  final double hra;
  final double allowances;
  final double pf;
  final double esi;
  final double tds;
  final double netSalary;

  WorkDetailsModel({
    required this.employeeId,
    required this.employeeName,
    this.email = '',
    required this.department,
    required this.designation,
    this.manager = 'N/A',
    this.employmentType = 'Full-Time',
    required this.salary,
    required this.basicSalary,
    required this.hra,
    required this.allowances,
    required this.pf,
    this.esi = 0.0,
    this.tds = 0.0,
    required this.netSalary,
  });

  double get monthlyGross => (basicSalary + hra + allowances);
  double get totalDeductions => (pf + esi + tds);

  factory WorkDetailsModel.fromUser(UserModel? user) {
    final name = (user != null && user.name.isNotEmpty) ? user.name : 'Employee';
    final email = user?.email ?? '';
    final dept = (user != null && user.department.isNotEmpty)
        ? user.department
        : (user?.isSalesDepartment == true ? 'Sales' : 'IT');
    final desig = (user != null && user.role.isNotEmpty)
        ? user.role.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ')
        : (dept == 'Sales' ? 'Sales Executive' : 'Software Engineer');

    final code = dept.toUpperCase().padRight(3, 'X').substring(0, 3);
    final suffix = (user != null && user.id.length >= 4)
        ? user.id.substring(user.id.length - 4).toUpperCase()
        : '001';
    final empId = '#RD26/$code/$suffix';

    final annualSalary = dept.toLowerCase() == 'sales' ? 360000.0 : 324000.0;
    final monthlyGross = (annualSalary / 12.0).roundToDouble();
    final basic = (monthlyGross * 0.5).roundToDouble();
    final hra = (monthlyGross * 0.3).roundToDouble();
    final allowances = (monthlyGross - basic - hra).clamp(0.0, double.infinity).roundToDouble();
    final pf = (basic * 0.12).roundToDouble();
    final netSalary = monthlyGross - pf;

    return WorkDetailsModel(
      employeeId: empId,
      employeeName: name,
      email: email,
      department: dept,
      designation: desig,
      manager: 'N/A',
      employmentType: 'Full-Time',
      salary: annualSalary,
      basicSalary: basic,
      hra: hra,
      allowances: allowances,
      pf: pf,
      esi: 0.0,
      tds: 0.0,
      netSalary: netSalary,
    );
  }

  factory WorkDetailsModel.fromJson(Map<String, dynamic> json, {UserModel? user}) {
    final userMap = json['user'] is Map ? json['user'] as Map<String, dynamic> : null;
    final name = userMap?['name']?.toString() ?? user?.name ?? 'Employee';
    final email = userMap?['email']?.toString() ?? user?.email ?? '';

    final dept = (json['department']?.toString().isNotEmpty == true)
        ? json['department'].toString()
        : (user?.department.isNotEmpty == true
            ? user!.department
            : (user?.isSalesDepartment == true ? 'Sales' : 'IT'));

    final desig = (json['designation']?.toString().isNotEmpty == true)
        ? json['designation'].toString()
        : (user?.role.isNotEmpty == true
            ? user!.role.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ')
            : 'Executive');

    final code = dept.toUpperCase().padRight(3, 'X').substring(0, 3);
    final suffix = (user != null && user.id.length >= 4)
        ? user.id.substring(user.id.length - 4).toUpperCase()
        : '001';
    final rawEmpId = json['employeeId']?.toString();
    final empId = (rawEmpId != null && rawEmpId.trim().isNotEmpty)
        ? (rawEmpId.startsWith('#') ? rawEmpId : '#$rawEmpId')
        : '#RD26/$code/$suffix';

    final mgr = json['manager'] is Map
        ? (json['manager']['user'] is Map ? json['manager']['user']['name'] : json['manager']['designation'])
        : null;

    final struct = json['salaryStructure'] is Map ? json['salaryStructure'] as Map<String, dynamic> : null;
    double rawSalary = (json['salary'] is num) ? (json['salary'] as num).toDouble() : 0.0;

    if (rawSalary <= 0) {
      if (struct != null && struct['netSalary'] is num && (struct['netSalary'] as num) > 0) {
        rawSalary = (struct['netSalary'] as num).toDouble() * 12.0;
      } else {
        rawSalary = dept.toLowerCase() == 'sales' ? 360000.0 : 324000.0;
      }
    }

    final monthlyGross = (rawSalary >= 60000 ? (rawSalary / 12.0) : rawSalary).roundToDouble();
    final basic = (struct?['basic'] is num && (struct!['basic'] as num) > 0)
        ? (struct['basic'] as num).toDouble()
        : (monthlyGross * 0.5).roundToDouble();
    final hra = (struct?['hra'] is num && (struct!['hra'] as num) > 0)
        ? (struct['hra'] as num).toDouble()
        : (monthlyGross * 0.3).roundToDouble();
    final allowances = (struct?['allowances'] is num)
        ? (struct!['allowances'] as num).toDouble()
        : (monthlyGross - basic - hra).clamp(0.0, double.infinity).roundToDouble();
    final pf = (struct?['pf'] is num && (struct!['pf'] as num) > 0)
        ? (struct['pf'] as num).toDouble()
        : (basic * 0.12).roundToDouble();
    final esi = (struct?['esi'] is num) ? (struct!['esi'] as num).toDouble() : 0.0;
    final tds = (struct?['tds'] is num) ? (struct!['tds'] as num).toDouble() : 0.0;
    final deductions = pf + esi + tds;
    final net = (struct?['netSalary'] is num && (struct!['netSalary'] as num) > 0)
        ? (struct['netSalary'] as num).toDouble()
        : (monthlyGross - deductions);

    return WorkDetailsModel(
      employeeId: empId,
      employeeName: name,
      email: email,
      department: dept,
      designation: desig,
      manager: (mgr ?? 'N/A').toString(),
      employmentType: (json['employmentType'] ?? 'Full-Time').toString(),
      salary: rawSalary,
      basicSalary: basic,
      hra: hra,
      allowances: allowances,
      pf: pf,
      esi: esi,
      tds: tds,
      netSalary: net,
    );
  }
}
