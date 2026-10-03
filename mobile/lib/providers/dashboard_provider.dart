import 'package:flutter/foundation.dart';
import '../data/models/dashboard_stats_model.dart';
import '../data/models/lead_model.dart';
import '../data/services/dashboard_service.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardService _service = DashboardService();

  DashboardStatsModel _stats = DashboardStatsModel();
  List<LeadModel> _recentLeads = [];
  bool _isLoading = false;
  String? _errorMessage;
  String? _errorEndpoint;
  bool _isAdminView = true;
  String _activeTab = 'summary';

  DashboardStatsModel get stats => _stats;
  List<LeadModel> get recentLeads => _recentLeads;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get errorEndpoint => _errorEndpoint;
  bool get isAdminView => _isAdminView;
  String get activeTab => _activeTab;

  void toggleViewMode() {
    _isAdminView = !_isAdminView;
    notifyListeners();
  }

  void setIsAdminView(bool value) {
    _isAdminView = value;
    notifyListeners();
  }

  void setActiveTab(String tab) {
    _activeTab = tab;
    notifyListeners();
  }

  void dismissError() {
    _errorMessage = null;
    _errorEndpoint = null;
    notifyListeners();
  }

  Future<void> fetchDashboardData() async {
    _isLoading = true;
    _errorMessage = null;
    _errorEndpoint = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.fetchFullDashboard(),
        _service.getRecentLeads(),
      ]);

      _stats = results[0] as DashboardStatsModel;
      _recentLeads = results[1] as List<LeadModel>;
      _errorMessage = null;
      _errorEndpoint = null;
    } catch (e) {
      debugPrint('Dashboard fetch note: $e');
      _errorMessage = e.toString();
      _errorEndpoint = '/employees/dashboard';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
