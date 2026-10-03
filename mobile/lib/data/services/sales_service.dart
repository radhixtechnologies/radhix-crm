import '../../core/network/api_client.dart';
import '../models/client_model.dart';
import '../models/deal_model.dart';
import '../models/lead_model.dart';

class SalesService {
  final ApiClient _client = ApiClient();

  Future<List<LeadModel>> getLeads({
    String? status,
    String? search,
    int page = 1,
    int limit = 30,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (status != null && status.isNotEmpty && status != 'all') {
      query['status'] = status;
    }
    if (search != null && search.isNotEmpty) {
      query['search'] = search;
    }

    final response = await _client.get('/sales/leads', queryParams: query);
    if (response is Map) {
      final list = (response['data'] ?? response['items']) as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map((j) => LeadModel.fromJson(j))
          .toList();
    }
    return [];
  }

  Future<LeadModel> getLead(String id) async {
    final response = await _client.get('/sales/leads/$id');
    if (response is Map && response['data'] != null) {
      return LeadModel.fromJson(Map<String, dynamic>.from(response['data']));
    }
    throw ApiException('Lead not found');
  }

  Future<LeadModel> createLead(Map<String, dynamic> data) async {
    final response = await _client.post('/sales/leads', body: data);
    if (response is Map && (response['data'] != null || response['success'] == true)) {
      final leadData = response['data'] ?? response;
      return LeadModel.fromJson(Map<String, dynamic>.from(leadData));
    }
    throw ApiException('Failed to create lead');
  }

  Future<LeadModel> updateLead(String id, Map<String, dynamic> data) async {
    final response = await _client.put('/sales/leads/$id', body: data);
    if (response is Map && (response['data'] != null || response['success'] == true)) {
      final leadData = response['data'] ?? response;
      return LeadModel.fromJson(Map<String, dynamic>.from(leadData));
    }
    throw ApiException('Failed to update lead');
  }

  Future<bool> updateLeadStatus(String id, String status) async {
    final response = await _client.put('/sales/leads/$id/status', body: {'status': status});
    return response is Map && response['success'] == true;
  }

  Future<bool> addLeadNote(String id, String content) async {
    final response = await _client.post('/sales/leads/$id/notes', body: {'content': content});
    return response is Map && response['success'] == true;
  }

  Future<List<ClientModel>> getClients({String? search}) async {
    final query = <String, dynamic>{'limit': 50};
    if (search != null && search.isNotEmpty) {
      query['search'] = search;
    }
    final response = await _client.get('/sales/clients', queryParams: query);
    if (response is Map) {
      final list = (response['data'] ?? response['items']) as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map((j) => ClientModel.fromJson(j))
          .toList();
    }
    return [];
  }

  Future<List<DealModel>> getDeals({String? stage}) async {
    final query = <String, dynamic>{'limit': 50};
    if (stage != null && stage.isNotEmpty) {
      query['stage'] = stage;
    }
    final response = await _client.get('/sales/deals', queryParams: query);
    if (response is Map) {
      final list = (response['data'] ?? response['items']) as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map((j) => DealModel.fromJson(j))
          .toList();
    }
    return [];
  }
}
