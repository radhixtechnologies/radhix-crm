class AttendanceModel {
  final String id;
  final DateTime date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final double hoursWorked;
  final String status;
  final bool isLate;
  final int lateMinutes;
  final String checkInMethod;

  AttendanceModel({
    required this.id,
    required this.date,
    this.checkIn,
    this.checkOut,
    this.hoursWorked = 0.0,
    this.status = 'present',
    this.isLate = false,
    this.lateMinutes = 0,
    this.checkInMethod = 'mobile',
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      checkIn: json['checkIn'] != null ? DateTime.tryParse(json['checkIn'].toString()) : null,
      checkOut: json['checkOut'] != null ? DateTime.tryParse(json['checkOut'].toString()) : null,
      hoursWorked: (json['hoursWorked'] is num) ? (json['hoursWorked'] as num).toDouble() : 0.0,
      status: (json['status'] ?? 'present').toString(),
      isLate: json['isLate'] ?? false,
      lateMinutes: (json['lateMinutes'] is num) ? (json['lateMinutes'] as num).toInt() : 0,
      checkInMethod: (json['checkInMethod'] ?? 'mobile').toString(),
    );
  }
}

class TodayAttendanceStatus {
  final bool isCheckedIn;
  final bool isCheckedOut;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final double hoursWorked;
  final String status;
  final int? monthlyHours;

  DateTime? get checkIn => checkInTime;
  DateTime? get checkOut => checkOutTime;

  TodayAttendanceStatus({
    this.isCheckedIn = false,
    this.isCheckedOut = false,
    this.checkInTime,
    this.checkOutTime,
    this.hoursWorked = 0.0,
    this.status = 'absent',
    this.monthlyHours = 160,
  });

  factory TodayAttendanceStatus.fromJson(Map<String, dynamic> json) {
    final record = json['data'] is Map ? json['data'] as Map<String, dynamic> : json;
    final checkIn = record['checkIn'] != null ? DateTime.tryParse(record['checkIn'].toString()) : null;
    final checkOut = record['checkOut'] != null ? DateTime.tryParse(record['checkOut'].toString()) : null;

    return TodayAttendanceStatus(
      isCheckedIn: checkIn != null,
      isCheckedOut: checkOut != null,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      hoursWorked: (record['hoursWorked'] is num) ? (record['hoursWorked'] as num).toDouble() : 0.0,
      status: (record['status'] ?? (checkIn != null ? 'present' : 'absent')).toString(),
    );
  }
}
