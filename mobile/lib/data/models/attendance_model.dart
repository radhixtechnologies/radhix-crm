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

  /// Dynamic active hours worked: calculates elapsed time if currently checked in
  double get activeHoursWorked {
    if (hoursWorked > 0) return hoursWorked;
    if (checkInTime != null) {
      final endTime = checkOutTime ?? DateTime.now();
      final diff = endTime.difference(checkInTime!).inMinutes / 60.0;
      if (diff > 0) {
        return (diff * 10).round() / 10.0;
      }
    }
    return 0.0;
  }

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

    final isPunchedIn = checkIn != null;
    final isPunchedOut = checkOut != null;

    String calculatedStatus = (record['status'] ?? (isPunchedIn ? 'present' : 'absent')).toString();
    if (isPunchedIn && calculatedStatus == 'absent') {
      calculatedStatus = 'present';
    }

    double parsedHours = (record['hoursWorked'] is num) ? (record['hoursWorked'] as num).toDouble() : 0.0;
    if (parsedHours <= 0 && isPunchedIn) {
      final endTime = checkOut ?? DateTime.now();
      final diff = endTime.difference(checkIn).inMinutes / 60.0;
      if (diff > 0) {
        parsedHours = (diff * 10).round() / 10.0;
      }
    }

    return TodayAttendanceStatus(
      isCheckedIn: isPunchedIn,
      isCheckedOut: isPunchedOut,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      hoursWorked: parsedHours,
      status: calculatedStatus,
    );
  }
}
