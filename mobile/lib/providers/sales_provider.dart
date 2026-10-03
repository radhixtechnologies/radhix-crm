import 'package:flutter/foundation.dart';
import '../data/models/client_model.dart';
import '../data/models/deal_model.dart';
import '../data/models/lead_model.dart';
import '../data/services/sales_service.dart';

class SalesProvider extends ChangeNotifier {
  final SalesService _service = SalesService();

  List<LeadModel> _leads = [];
  List<ClientModel> _clients = [];
  List<DealModel> _deals = [];

  String _selectedStatus = 'all';
  String _searchQuery = '';
  bool _isLoading = false;
  String? _errorMessage;

  List<LeadModel> get leads => _leads;
  List<ClientModel> get clients => _clients;
  List<DealModel> get deals => _deals;
  String get selectedStatus => _selectedStatus;
  String get searchQuery => _searchQuery;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<LeadModel> get filteredLeads {
    return _leads.where((l) {
      final matchesStatus = _selectedStatus == 'all' || l.status.toLowerCase() == _selectedStatus.toLowerCase();
      final matchesSearch = _searchQuery.isEmpty ||
          l.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          l.company.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          l.phone.contains(_searchQuery);
      return matchesStatus && matchesSearch;
    }).toList();
  }

  void setFilterStatus(String status) {
    _selectedStatus = status;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> fetchLeads() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _leads = await _service.getLeads(
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

  Future<bool> createLead(Map<String, dynamic> data) async {
    try {
      final newLead = await _service.createLead(data);
      _leads.insert(0, newLead);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStatus(String leadId, String newStatus) async {
    try {
      final success = await _service.updateLeadStatus(leadId, newStatus);
      if (success) {
        final index = _leads.indexWhere((l) => l.id == leadId);
        if (index != -1) {
          final old = _leads[index];
          _leads[index] = LeadModel(
            id: old.id,
            name: old.name,
            email: old.email,
            phone: old.phone,
            company: old.company,
            source: old.source,
            status: newStatus,
            leadTemperature: old.leadTemperature,
            value: old.value,
            currency: old.currency,
            assignedToName: old.assignedToName,
            notes: old.notes,
            createdAt: old.createdAt,
          );
          notifyListeners();
        }
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addLeadNote(String leadId, String content) async {
    try {
      final success = await _service.addLeadNote(leadId, content);
      if (success) {
        await fetchLeads();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchClients() async {
    _isLoading = true;
    notifyListeners();
    try {
      _clients = await _service.getClients();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDeals() async {
    _isLoading = true;
    notifyListeners();
    try {
      _deals = await _service.getDeals();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
