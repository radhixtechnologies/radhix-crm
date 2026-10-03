import '../../core/network/api_client.dart';
import '../models/dashboard_stats_model.dart';
import '../models/lead_model.dart';

class DashboardService {
  final ApiClient _client = ApiClient();

  Future<DashboardStatsModel> fetchFullDashboard() async {
    Map<String, dynamic>? overview;
    Map<String, dynamic>? hrm;
    Map<String, dynamic>? attendance;
    Map<String, dynamic>? sales;
    Map<String, dynamic>? finance;
    Map<String, dynamic>? notifications;
    List<dynamic>? activities;

    // Run parallel calls with individual error catching so if one endpoint fails, others still load!
    await Future.wait([
      _client.get('/dashboard/superadmin/overview').then((res) {
        if (res is Map && res['data'] is Map) {
          overview = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/hrm').then((res) {
        if (res is Map && res['data'] is Map) {
          hrm = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/attendance').then((res) {
        if (res is Map && res['data'] is Map) {
          attendance = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/sales').then((res) {
        if (res is Map && res['data'] is Map) {
          sales = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/finance').then((res) {
        if (res is Map && res['data'] is Map) {
          finance = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/notifications').then((res) {
        if (res is Map && res['data'] is Map) {
          notifications = Map<String, dynamic>.from(res['data']);
        }
      }).catchError((_) {}),

      _client.get('/dashboard/superadmin/activity', queryParams: {'limit': 10}).then((res) {
        if (res is Map && res['data'] is Map) {
          activities = res['data']['logs'] as List?;
        }
      }).catchError((_) {}),
    ]);

    // Fallback: if all superadmin endpoints failed (e.g. employee role), try employee dashboard
    if (overview == null && sales == null && finance == null) {
      try {
        final empRes = await _client.get('/employees/dashboard');
        if (empRes is Map && empRes['data'] is Map) {
          overview = {'employees': empRes['data']['stats'] ?? {}};
        }
      } catch (_) {}
    }

    try {
      return DashboardStatsModel.fromApiData(
        overview: overview,
        hrm: hrm,
        attendance: attendance,
        sales: sales,
        finance: finance,
        notifications: notifications,
        activities: activities,
      );
    } catch (_) {
      return DashboardStatsModel();
    }
  }

  Future<List<LeadModel>> getRecentLeads() async {
    try {
      final response = await _client.get('/sales/leads', queryParams: {
        'limit': '5',
        'sort': '-createdAt',
      });
      if (response is Map) {
        final list = (response['data'] ?? response['items']) as List? ?? [];
        return list
            .whereType<Map<String, dynamic>>()
            .map((json) => LeadModel.fromJson(json))
            .toList();
      }
    } catch (_) {}
    return [];
  }
}
