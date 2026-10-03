class LeaveModel {
  final String id;
  final String type;
  final DateTime startDate;
  final DateTime endDate;
  final double days;
  final bool halfDay;
  final String reason;
  final String status;
  final String? comments;
  final String? rejectionReason;
  final DateTime? createdAt;

  LeaveModel({
    required this.id,
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.days,
    this.halfDay = false,
    required this.reason,
    this.status = 'pending',
    this.comments,
    this.rejectionReason,
    this.createdAt,
  });

  factory LeaveModel.fromJson(Map<String, dynamic> json) {
    return LeaveModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: (json['type'] ?? 'casual').toString(),
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      days: (json['days'] is num) ? (json['days'] as num).toDouble() : 1.0,
      halfDay: json['halfDay'] ?? false,
      reason: (json['reason'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      comments: json['comments']?.toString(),
      rejectionReason: json['rejectionReason']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class LeaveBalanceModel {
  final double casual;
  final double sick;
  final double annual;
  final double used;
  final double total;

  LeaveBalanceModel({
    this.casual = 12,
    this.sick = 8,
    this.annual = 15,
    this.used = 0,
    this.total = 35,
  });

  double get totalRemaining => (total - used) > 0 ? (total - used) : (casual + sick + annual - used);

  factory LeaveBalanceModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map ? json['data'] as Map<String, dynamic> : json;
    return LeaveBalanceModel(
      casual: (data['casual'] is num) ? (data['casual'] as num).toDouble() : 12.0,
      sick: (data['sick'] is num) ? (data['sick'] as num).toDouble() : 8.0,
      annual: (data['annual'] is num) ? (data['annual'] as num).toDouble() : 15.0,
      used: (data['used'] is num) ? (data['used'] as num).toDouble() : 0.0,
      total: (data['total'] is num) ? (data['total'] as num).toDouble() : 35.0,
    );
  }
}
