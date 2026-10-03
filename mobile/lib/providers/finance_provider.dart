import 'package:flutter/foundation.dart';
import '../data/models/invoice_model.dart';
import '../data/services/finance_service.dart';

class FinanceProvider extends ChangeNotifier {
  final FinanceService _service = FinanceService();

  List<InvoiceModel> _invoices = [];
  String _selectedStatus = 'all';
  String _searchQuery = '';
  bool _isLoading = false;
  String? _errorMessage;

  List<InvoiceModel> get invoices => _invoices;
  String get selectedStatus => _selectedStatus;
  String get searchQuery => _searchQuery;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<InvoiceModel> get filteredInvoices {
    return _invoices.where((inv) {
      final matchesStatus = _selectedStatus == 'all' || inv.status.toLowerCase() == _selectedStatus.toLowerCase();
      final matchesSearch = _searchQuery.isEmpty ||
          inv.invoiceNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          inv.clientName.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).toList();
  }

  double get totalRevenue =>
      _invoices.fold(0.0, (sum, item) => sum + (item.status == 'paid' ? item.total : item.amountPaid));

  double get totalOutstanding =>
      _invoices.fold(0.0, (sum, item) => sum + item.balanceDue);

  void setFilterStatus(String status) {
    _selectedStatus = status;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> fetchInvoices() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _invoices = await _service.getInvoices(
        status: _selectedStatus == 'all' ? null : _selectedStatus,
        search: _searchQuery.isEmpty ? null : _searchQuery,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateStatus(String invoiceId, String status) async {
    try {
      final success = await _service.updateStatus(invoiceId, status);
      if (success) {
        await fetchInvoices();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
