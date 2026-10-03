num _toNum(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

class DepartmentCount {
  final String department;
  final int count;

  DepartmentCount({required this.department, required this.count});

  factory DepartmentCount.fromJson(Map<String, dynamic> json) {
    return DepartmentCount(
      department: (json['department'] ?? json['_id'] ?? 'General').toString(),
      count: _toNum(json['count']).toInt(),
    );
  }
}

class MonthTrendItem {
  final String month;
  final double value1;
  final double value2;

  MonthTrendItem({required this.month, required this.value1, required this.value2});

  factory MonthTrendItem.fromJson(Map<String, dynamic> json) {
    return MonthTrendItem(
      month: (json['month'] ?? json['date'] ?? json['day'] ?? '').toString(),
      value1: _toNum(json['income'] ?? json['new'] ?? json['present'] ?? json['count']).toDouble(),
      value2: _toNum(json['expense'] ?? json['loyal'] ?? json['absent']).toDouble(),
    );
  }
}

class TopProductItem {
  final String name;
  final int sales;
  final double value;
  final int popularity;

  TopProductItem({
    required this.name,
    this.sales = 0,
    this.value = 0.0,
    this.popularity = 0,
  });

  factory TopProductItem.fromJson(Map<String, dynamic> json) {
    return TopProductItem(
      name: (json['name'] ?? json['_id'] ?? 'Product').toString(),
      sales: _toNum(json['sales']).toInt(),
      value: _toNum(json['value']).toDouble(),
      popularity: _toNum(json['popularity']).toInt(),
    );
  }
}

class ActivityLogItem {
  final String id;
  final String action;
  final String description;
  final String userName;
  final DateTime? timestamp;

  ActivityLogItem({
    required this.id,
    required this.action,
    required this.description,
    required this.userName,
    this.timestamp,
  });

  factory ActivityLogItem.fromJson(Map<String, dynamic> json) {
    return ActivityLogItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      action: (json['action'] ?? json['type'] ?? 'Action').toString(),
      description: (json['description'] ?? json['details'] ?? json['message'] ?? '').toString(),
      userName: json['user'] is Map
          ? (json['user']['name'] ?? 'User').toString()
          : (json['userName'] ?? 'User').toString(),
      timestamp: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class DashboardStatsModel {
  // Staff & Employees
  final int totalEmployees;
  final int activeEmployees;
  final int newHiresThisMonth;
  final List<DepartmentCount> departmentCounts;
  final List<MonthTrendItem> headcountTrend;

  // Finance
  final double totalRevenue;
  final double totalExpenses;
  final double netProfit;
  final int pendingInvoices;
  final int overdueInvoices;
  final int processedPayroll;
  final List<MonthTrendItem> incomeExpenseTrend;
  final Map<String, double> expenseBreakdown;

  // Sales & Leads
  final int totalLeads;
  final int newLeads;
  final int contactedLeads;
  final int qualifiedLeads;
  final int closedLeads;
  final int totalOrders;
  final int productsSold;
  final double dealsPipelineValue;
  final List<MonthTrendItem> leadTrend;
  final List<TopProductItem> topProducts;

  // HRM
  final int pendingLeaves;
  final int openJobPosts;
  final int totalApplicants;

  // Attendance
  final int presentToday;
  final int absentToday;
  final int lateToday;
  final int liveCheckIns;
  final List<MonthTrendItem> attendanceTrend;

  // System
  final String uptime;
  final String apiLatency;
  final int systemAlertsCount;
  final List<ActivityLogItem> recentLogs;

  int get activeDeals => qualifiedLeads;
  int get activeClients => closedLeads > 0 ? closedLeads : 5;

  DashboardStatsModel({
    this.totalEmployees = 0,
    this.activeEmployees = 0,
    this.newHiresThisMonth = 0,
    this.departmentCounts = const [],
    this.headcountTrend = const [],
    this.totalRevenue = 0.0,
    this.totalExpenses = 0.0,
    this.netProfit = 0.0,
    this.pendingInvoices = 0,
    this.overdueInvoices = 0,
    this.processedPayroll = 0,
    this.incomeExpenseTrend = const [],
    this.expenseBreakdown = const {},
    this.totalLeads = 0,
    this.newLeads = 0,
    this.contactedLeads = 0,
    this.qualifiedLeads = 0,
    this.closedLeads = 0,
    this.totalOrders = 0,
    this.productsSold = 0,
    this.dealsPipelineValue = 0.0,
    this.leadTrend = const [],
    this.topProducts = const [],
    this.pendingLeaves = 0,
    this.openJobPosts = 0,
    this.totalApplicants = 0,
    this.presentToday = 0,
    this.absentToday = 0,
    this.lateToday = 0,
    this.liveCheckIns = 0,
    this.attendanceTrend = const [],
    this.uptime = '99.9%',
    this.apiLatency = '45ms',
    this.systemAlertsCount = 0,
    this.recentLogs = const [],
  });

  factory DashboardStatsModel.fromApiData({
    Map<String, dynamic>? overview,
    Map<String, dynamic>? hrm,
    Map<String, dynamic>? attendance,
    Map<String, dynamic>? sales,
    Map<String, dynamic>? finance,
    Map<String, dynamic>? notifications,
    List<dynamic>? activities,
  }) {
    // Parse Employees
    final emp = overview?['employees'] ?? {};
    final totalEmp = _toNum(emp['total']).toInt();
    final activeEmp = _toNum(emp['active']).toInt();
    final newHires = _toNum(emp['newHiresThisMonth']).toInt();

    final depRaw = (emp['departmentCounts'] as List?) ?? [];
    final depCounts = depRaw
        .whereType<Map<String, dynamic>>()
        .map((d) => DepartmentCount.fromJson(d))
        .toList();

    // Parse Finance
    final rev = _toNum(finance?['totalRevenue']).toDouble();
    final exp = _toNum(finance?['totalExpenses']).toDouble();
    final invPending = _toNum(finance?['invoices']?['pending']).toInt();
    final invOverdue = _toNum(finance?['invoices']?['overdue']).toInt();
    final payrollProc = _toNum(finance?['payroll']?['processed']).toInt();

    final rawFinanceTrend = (finance?['incomeExpenseTrend'] as List?) ?? [];
    final financeTrend = rawFinanceTrend
        .whereType<Map<String, dynamic>>()
        .map((d) => MonthTrendItem.fromJson(d))
        .toList();

    // Parse Sales
    final leads = sales?['leads'] ?? {};
    final tLeads = _toNum(leads['total']).toInt();
    final nLeads = _toNum(leads['new']).toInt();
    final cLeads = _toNum(leads['contacted']).toInt();
    final qLeads = _toNum(leads['qualified']).toInt();
    final clLeads = _toNum(leads['closed'] ?? leads['won']).toInt();
    final tOrders = _toNum(sales?['totalOrders']).toInt();
    final pSold = _toNum(sales?['productsSold']).toInt();

    final rawLeadTrend = (sales?['leadTrend'] as List?) ?? [];
    final lTrend = rawLeadTrend
        .whereType<Map<String, dynamic>>()
        .map((d) => MonthTrendItem.fromJson(d))
        .toList();

    final rawTopProd = (sales?['topProducts'] as List?) ?? [];
    final tProducts = rawTopProd
        .whereType<Map<String, dynamic>>()
        .map((d) => TopProductItem.fromJson(d))
        .toList();

    // Parse HRM
    final pLeaves = _toNum(hrm?['pendingLeaves']).toInt();
    final oJobs = _toNum(hrm?['openJobPosts']).toInt();
    final tApplicants = _toNum(hrm?['totalApplicants']).toInt();

    // Parse Attendance
    final attToday = attendance?['today'] ?? {};
    final pToday = _toNum(attToday['present']).toInt();
    final abToday = _toNum(attToday['absent']).toInt();
    final lToday = _toNum(attToday['late']).toInt();
    final live = _toNum(attendance?['liveCheckIns']).toInt();

    final rawAttTrend = (attendance?['attendanceTrend'] as List?) ?? [];
    final attTrend = rawAttTrend
        .whereType<Map<String, dynamic>>()
        .map((d) => MonthTrendItem.fromJson(d))
        .toList();

    // Activity Logs
    final logs = (activities ?? [])
        .whereType<Map<String, dynamic>>()
        .map((a) => ActivityLogItem.fromJson(a))
        .toList();

    final alertsCount = (notifications?['systemAlerts'] as List?)?.length ?? 0;

    return DashboardStatsModel(
      totalEmployees: totalEmp,
      activeEmployees: activeEmp,
      newHiresThisMonth: newHires,
      departmentCounts: depCounts,
      totalRevenue: rev,
      totalExpenses: exp,
      netProfit: rev - exp,
      pendingInvoices: invPending,
      overdueInvoices: invOverdue,
      processedPayroll: payrollProc,
      incomeExpenseTrend: financeTrend,
      totalLeads: tLeads,
      newLeads: nLeads,
      contactedLeads: cLeads,
      qualifiedLeads: qLeads,
      closedLeads: clLeads,
      totalOrders: tOrders,
      productsSold: pSold,
      dealsPipelineValue: rev * 1.5,
      leadTrend: lTrend,
      topProducts: tProducts,
      pendingLeaves: pLeaves,
      openJobPosts: oJobs,
      totalApplicants: tApplicants,
      presentToday: pToday,
      absentToday: abToday,
      lateToday: lToday,
      liveCheckIns: live,
      attendanceTrend: attTrend,
      recentLogs: logs,
      systemAlertsCount: alertsCount,
    );
  }
}
