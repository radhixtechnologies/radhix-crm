import 'package:flutter/foundation.dart';
import '../data/models/attendance_model.dart';
import '../data/services/attendance_service.dart';

class AttendanceProvider extends ChangeNotifier {
  final AttendanceService _service = AttendanceService();

  TodayAttendanceStatus _todayStatus = TodayAttendanceStatus();
  List<AttendanceModel> _history = [];
  bool _isLoading = false;
  String? _errorMessage;

  TodayAttendanceStatus get todayStatus => _todayStatus;
  List<AttendanceModel> get history => _history;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchTodayStatus() async {
    try {
      _todayStatus = await _service.getTodayStatus();
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> fetchHistory() async {
    _isLoading = true;
    notifyListeners();
    try {
      _history = await _service.getHistory();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> punchCheckIn() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _todayStatus = await _service.checkIn();
      await fetchHistory();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> punchCheckOut() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _todayStatus = await _service.checkOut();
      await fetchHistory();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> punchIn() => punchCheckIn();
  Future<bool> punchOut() => punchCheckOut();
}
