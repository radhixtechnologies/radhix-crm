import '../../core/network/api_client.dart';
import '../models/attendance_model.dart';

class AttendanceService {
  final ApiClient _client = ApiClient();

  Future<TodayAttendanceStatus> getTodayStatus() async {
    try {
      final response = await _client.get('/attendance/today');
      if (response is Map) {
        return TodayAttendanceStatus.fromJson(Map<String, dynamic>.from(response));
      }
    } catch (_) {}
    return TodayAttendanceStatus();
  }

  Future<TodayAttendanceStatus> checkIn({String method = 'mobile'}) async {
    final response = await _client.post('/attendance/checkin', body: {
      'checkInMethod': method,
      'checkInLocation': {'device': 'Mobile App'},
    });
    if (response is Map && (response['success'] == true || response['data'] != null)) {
      return TodayAttendanceStatus.fromJson(Map<String, dynamic>.from(response));
    }
    throw ApiException(
      response is Map && response['message'] != null
          ? response['message'].toString()
          : 'Check-in failed',
    );
  }

  Future<TodayAttendanceStatus> checkOut({String method = 'mobile'}) async {
    final response = await _client.post('/attendance/checkout', body: {
      'checkOutMethod': method,
      'checkOutLocation': {'device': 'Mobile App'},
    });
    if (response is Map && (response['success'] == true || response['data'] != null)) {
      return TodayAttendanceStatus.fromJson(Map<String, dynamic>.from(response));
    }
    throw ApiException(
      response is Map && response['message'] != null
          ? response['message'].toString()
          : 'Check-out failed',
    );
  }

  Future<List<AttendanceModel>> getHistory({int limit = 30}) async {
    try {
      final response = await _client.get('/attendance', queryParams: {'limit': limit});
      if (response is Map) {
        final list = (response['data'] ?? response['items']) as List? ?? [];
        return list
            .whereType<Map<String, dynamic>>()
            .map((j) => AttendanceModel.fromJson(j))
            .toList();
      }
    } catch (_) {}
    return [];
  }
}
