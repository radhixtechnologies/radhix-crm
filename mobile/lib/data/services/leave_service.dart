import '../../core/network/api_client.dart';
import '../models/leave_model.dart';

class LeaveService {
  final ApiClient _client = ApiClient();

  Future<List<LeaveModel>> getLeaves() async {
    try {
      final response = await _client.get('/employees/leaves');
      if (response is Map) {
        final list = (response['data'] ?? response['items']) as List? ?? [];
        return list
            .whereType<Map<String, dynamic>>()
            .map((j) => LeaveModel.fromJson(j))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<LeaveModel> applyLeave({
    required String type,
    required DateTime startDate,
    required DateTime endDate,
    required double days,
    required String reason,
    bool halfDay = false,
  }) async {
    final response = await _client.post('/employees/leaves', body: {
      'type': type.toLowerCase(),
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'days': days,
      'reason': reason.trim(),
      'halfDay': halfDay,
    });

    if (response is Map && (response['success'] == true || response['data'] != null)) {
      final lData = response['data'] ?? response;
      return LeaveModel.fromJson(Map<String, dynamic>.from(lData));
    }
    throw ApiException(
      response is Map && response['message'] != null
          ? response['message'].toString()
          : 'Failed to submit leave application',
    );
  }

  Future<LeaveBalanceModel> getLeaveBalance(String? employeeId) async {
    if (employeeId != null && employeeId.isNotEmpty) {
      try {
        final response = await _client.get('/employees/leave-balance/$employeeId');
        if (response is Map) {
          return LeaveBalanceModel.fromJson(Map<String, dynamic>.from(response));
        }
      } catch (_) {}
    }
    return LeaveBalanceModel();
  }
}
