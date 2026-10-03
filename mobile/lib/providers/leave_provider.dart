import 'package:flutter/foundation.dart';
import '../data/models/leave_model.dart';
import '../data/services/leave_service.dart';

class LeaveProvider extends ChangeNotifier {
  final LeaveService _service = LeaveService();

  List<LeaveModel> _leaves = [];
  LeaveBalanceModel _balance = LeaveBalanceModel();
  bool _isLoading = false;
  String? _errorMessage;

  List<LeaveModel> get leaves => _leaves;
  LeaveBalanceModel get balance => _balance;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchLeaves() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _leaves = await _service.getLeaves();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBalance(String? employeeId) async {
    try {
      _balance = await _service.getLeaveBalance(employeeId);
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> applyLeave({
    required String type,
    required DateTime startDate,
    required DateTime endDate,
    required double days,
    required String reason,
    bool halfDay = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newLeave = await _service.applyLeave(
        type: type,
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: reason,
        halfDay: halfDay,
      );
      _leaves.insert(0, newLeave);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
